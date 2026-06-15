from datetime import datetime
from typing import Dict, Optional

from app import db
from app.models import Group, Participant, RankNewItem, Pairwise


class RankingService:

    user_rank_cache: dict = {}

    @staticmethod
    def _cache_key(username: str, class_code: str) -> str:
        return f"{username}_{class_code}"


    @staticmethod
    def load_user_rank_cache(username: str, class_code: str) -> dict:
        participant = Participant.query.filter_by(
            username=username,
            class_code=class_code,
        ).first()

        table: dict[int, dict] = {}
        participant_id = None
        if participant:
            participant_id = participant.participant_id
            for item in participant.items:
                table[item.group_id] = {
                    "rating": item.rating,
                    "position": item.position,
                    "id": item.id,
                }

        key = RankingService._cache_key(username, class_code)
        RankingService.user_rank_cache[key] = {
            "table": table,
            "participant_id": participant_id,
        }

        print(f"\n[LOAD_CACHE] username={username}, class_code={class_code}, participant_id={participant_id}")
        print(f"[LOAD_CACHE] Loaded groups: {list(table.keys())}")
        return table


    @staticmethod
    def _get_cache(username: str, class_code: str) -> dict:
        key = RankingService._cache_key(username, class_code)
        return RankingService.user_rank_cache.get(key, {})


    @staticmethod
    def _get_table(username: str, class_code: str) -> dict:
        return RankingService._get_cache(username, class_code).get("table", {})


    @staticmethod
    def _get_participant_id(username: str, class_code: str):
        return RankingService._get_cache(username, class_code).get("participant_id")


    @staticmethod
    def add_to_cache(
        username: str,
        class_code: str,
        group_id: int,
        rating: int,
        position: int,
        item_id: int,
    ) -> None:
        key = RankingService._cache_key(username, class_code)
        if key not in RankingService.user_rank_cache:
            RankingService.user_rank_cache[key] = {"table": {}, "participant_id": None}
        RankingService.user_rank_cache[key]["table"][group_id] = {
            "rating": rating,
            "position": position,
            "id": item_id,
        }
        print(f"[ADD_CACHE] Added: group_id={group_id}, rating={rating}, pos={position}")


    @staticmethod
    def _set_participant_id(username: str, class_code: str, pid: int) -> None:
        key = RankingService._cache_key(username, class_code)
        if key not in RankingService.user_rank_cache:
            RankingService.user_rank_cache[key] = {"table": {}, "participant_id": None}
        RankingService.user_rank_cache[key]["participant_id"] = pid


    @staticmethod
    def update_position_in_cache(
        username: str, class_code: str, group_id: int, new_position: int
    ) -> None:
        table = RankingService._get_table(username, class_code)
        if group_id in table:
            old_pos = table[group_id]["position"]
            table[group_id]["position"] = new_position
            print(f"[UPDATE_POS] group_id={group_id}: {old_pos} -> {new_position}")

    @staticmethod
    def get_conflict_groups(
        username: str,
        class_code: str,
        rating: int,
        exclude_group_id: int = None,
    ) -> list[int]:
        table = RankingService._get_table(username, class_code)
        conflicts = [
            gid
            for gid, data in table.items()
            if data.get("rating") == rating
        ]

        if exclude_group_id is not None:
            conflicts = [gid for gid in conflicts if gid != exclude_group_id]

        conflicts.sort(key=lambda gid: (table.get(gid, {}).get("position", 9999), gid))

        print(f"[CONFLICTS] rating={rating}, exclude={exclude_group_id}: {conflicts}")
        return conflicts

    @staticmethod
    def compare_groups_by_pairwise(
        group_a: int,
        group_b: int,
        username: str,
        class_code: str,
        id_to_number: Optional[Dict[int, int]] = None,
    ) -> int:
        participant_id = RankingService._get_participant_id(username, class_code)
        if not participant_id:
            return 0

        id_to_number = id_to_number or {}
        num_a = id_to_number.get(group_a, group_a)
        num_b = id_to_number.get(group_b, group_b)
        q1 = f"{num_a},{num_b}"
        q2 = f"{num_b},{num_a}"

        p1 = (
            Pairwise.query.filter_by(
                participant_id=participant_id,
                class_code=class_code,
                pairwise_q=q1,
            )
            .order_by(Pairwise.answer_time.desc())
            .first()
        )
        p2 = (
            Pairwise.query.filter_by(
                participant_id=participant_id,
                class_code=class_code,
                pairwise_q=q2,
            )
            .order_by(Pairwise.answer_time.desc())
            .first()
        )

        pair = p1 or p2
        if not pair:
            return 0

        winner = pair.answer

        if pair.pairwise_q == q1:
            if winner == num_a:
                return 1
            if winner == num_b:
                return -1
        else:
            if winner == num_b:
                return -1
            if winner == num_a:
                return 1

        return 0

    @staticmethod
    def resolve_conflicts_toposort(
        username: str,
        class_code: str,
        rating: int,
        exclude_group_id: int = None,
    ) -> list[int]:
        conflicts = RankingService.get_conflict_groups(
            username=username,
            class_code=class_code,
            rating=rating,
            exclude_group_id=exclude_group_id,
        )

        print(f"\n[TOPOSORT] Sorting {len(conflicts)} groups")

        if len(conflicts) <= 1:
            return conflicts

        rows = (
            db.session.query(Group.id, Group.number)
            .filter(Group.class_code == class_code, Group.id.in_(conflicts))
            .all()
        )
        id_to_number = {row.id: row.number for row in rows}

        graph: dict[int, list[int]] = {g: [] for g in conflicts}
        in_degree: dict[int, int] = {g: 0 for g in conflicts}

        print(f"[TOPOSORT] Building graph...")
        for a in conflicts:
            for b in conflicts:
                if a == b:
                    continue
                c = RankingService.compare_groups_by_pairwise(
                    a,
                    b,
                    username=username,
                    class_code=class_code,
                    id_to_number=id_to_number,
                )
                if c > 0:
                    graph[a].append(b)
                    in_degree[b] += 1

        print(f"[TOPOSORT] Graph edges: {graph}")
        print(f"[TOPOSORT] In-degrees: {in_degree}")

        table = RankingService._get_table(username, class_code)

        def _tie_key(gid):
            return (table.get(gid, {}).get("position", 9999), gid)

        queue = [g for g in conflicts if in_degree[g] == 0]
        queue.sort(key=_tie_key)
        result = []

        print(f"[TOPOSORT] Initial queue (in_degree=0): {queue}")
        while queue:
            node = queue.pop(0)
            result.append(node)
            print(f"[TOPOSORT] Processing: {node}")

            for neighbor in graph[node]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)
                    print(f"[TOPOSORT]   Added to queue: {neighbor}")
            queue.sort(key=_tie_key)

        print(f"[TOPOSORT] Final order: {result}\n")
        return result

    @staticmethod
    def save_positions_to_db(username: str, class_code: str) -> None:
        table = RankingService._get_table(username, class_code)
        if not table:
            print("[SAVE_DB] Table is empty")
            return

        print("\n[SAVE_DB] Saving to DB:")
        for group_id, data in table.items():
            item_id = data.get("id")
            if not item_id:
                continue
            item = RankNewItem.query.get(item_id)
            if not item:
                continue
            old_pos = item.position
            item.position = data.get("position", item.position)
            item.updated_at = datetime.now()
            print(f"[SAVE_DB] group_id={group_id}: {old_pos} -> {item.position}")

        db.session.commit()
        print("[SAVE_DB] Committed\n")

    @staticmethod
    def _group_ids_to_numbers(class_code: str, group_ids: list) -> list:
        if not group_ids:
            return []
        rows = (
            db.session.query(Group.id, Group.number)
            .filter(Group.class_code == class_code, Group.id.in_(group_ids))
            .all()
        )
        id_to_number = {row.id: row.number for row in rows}
        numbers = []
        for gid in group_ids:
            num = id_to_number.get(gid)
            if num is not None:
                numbers.append(num)
        return numbers

    @staticmethod
    def add_group_to_rank(
        username: str,
        class_code: str,
        group_id: int,
        rating: int,
    ) -> dict:
        print("\n" + "=" * 100)
        print(f"[ADD_GROUP] START: username={username}, class_code={class_code}, group_id={group_id}, rating={rating}")
        print("=" * 100)

        cache = RankingService._get_cache(username, class_code)
        if not cache:
            RankingService.load_user_rank_cache(username, class_code)

        table = RankingService._get_table(username, class_code)

        if group_id in table:
            print(f"[ADD_GROUP] Group {group_id} already exists")
            print("=" * 100 + "\n")
            return {"existing": True, "conflict": False, "sorted_groups": []}

        participant = Participant.query.filter_by(
            username=username,
            class_code=class_code,
        ).first()
        if not participant:
            participant = Participant(username=username, class_code=class_code)
            db.session.add(participant)
            db.session.flush()

        RankingService._set_participant_id(username, class_code, participant.participant_id)

        next_position = len(table) + 1
        item = RankNewItem(
            participant_id=participant.participant_id,
            group_id=group_id,
            rating=rating,
            class_code=class_code,
            position=next_position,
        )
        db.session.add(item)
        db.session.flush()

        RankingService.add_to_cache(
            username=username,
            class_code=class_code,
            group_id=group_id,
            rating=rating,
            position=next_position,
            item_id=item.id,
        )
        db.session.commit()

        all_groups_with_rating = RankingService.get_conflict_groups(
            username=username,
            class_code=class_code,
            rating=rating,
            exclude_group_id=None,
        )

        if len(all_groups_with_rating) <= 1:
            print("[ADD_GROUP] No conflicts")
            print("=" * 100 + "\n")
            return {"existing": False, "conflict": False, "sorted_groups": []}

        print("[ADD_GROUP] Sorting with TOPOLOGICAL SORT...")

        sorted_ids = RankingService.resolve_conflicts_toposort(
            username=username,
            class_code=class_code,
            rating=rating,
            exclude_group_id=None,
        )

        print(f"\n[ADD_GROUP] Sorted order: {sorted_ids}")

        if not sorted_ids:
            print("[ADD_GROUP] ERROR: sorted_ids is empty!")
            print("=" * 100 + "\n")
            return {"existing": False, "conflict": False, "sorted_groups": []}

        print("\n[ADD_GROUP] Assigning positions...")
        for pos, gid in enumerate(sorted_ids, start=1):
            RankingService.update_position_in_cache(
                username=username,
                class_code=class_code,
                group_id=gid,
                new_position=pos,
            )

        RankingService.save_positions_to_db(username, class_code)
        RankingService.print_cache(username, class_code)

        conflicts_to_show = [gid for gid in sorted_ids if gid != group_id]

        conflicts_for_api = RankingService._group_ids_to_numbers(
            class_code, conflicts_to_show
        )
        print(
            f"[ADD_GROUP] RETURNING: conflict_ids={conflicts_to_show}, "
            f"conflict_numbers={conflicts_for_api}"
        )
        print("=" * 100 + "\n")

        return {
            "existing": False,
            "conflict": True,
            "sorted_groups": conflicts_for_api,
        }

    @staticmethod
    def resort_all_ratings_for_user(username: str, class_code: str) -> dict:
        print("\n[RESORT] Resorting all ratings...")
        table = RankingService.load_user_rank_cache(username, class_code)
        if not table:
            return {}

        groups_by_rating: dict[int, list[int]] = {}
        for gid, data in table.items():
            r = data.get("rating")
            if r is None:
                continue
            groups_by_rating.setdefault(r, []).append(gid)

        for rating, groups in groups_by_rating.items():
            if len(groups) <= 1:
                continue

            print(f"[RESORT] Resorting rating={rating}")

            sorted_ids = RankingService.resolve_conflicts_toposort(
                username=username,
                class_code=class_code,
                rating=rating,
                exclude_group_id=None,
            )

            if not sorted_ids:
                continue

            for pos, gid in enumerate(sorted_ids, start=1):
                RankingService.update_position_in_cache(
                    username=username,
                    class_code=class_code,
                    group_id=gid,
                    new_position=pos,
                )

        RankingService.save_positions_to_db(username, class_code)
        final_table = RankingService._get_table(username, class_code)
        print(f"[RESORT] DONE")
        return final_table

    @staticmethod
    def print_cache(username: str, class_code: str) -> None:
        table = RankingService._get_table(username, class_code)
        print(f"[CACHE] Final state:")
        if not table:
            print("[CACHE]   (empty)")
            return
        for gid, data in sorted(
            table.items(), key=lambda kv: kv[1].get("position", 0)
        ):
            print(
                f"[CACHE]   pos={data.get('position')} "
                f"group={gid} rating={data.get('rating')}"
            )