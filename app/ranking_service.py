from datetime import datetime
from app import db
from app.models import RankNew, RankNewItem, Pairwise


class RankingService:
    """
    Сервис управления рейтингами с хеш-таблицей и сортировкой конфликтов.
    БЕЗ ДАТЫ - данные хранятся НАВСЕГДА!

    Кеш в памяти:
        user_rank_cache = {
            username: {
                class_code: {
                    group_id: {"rating": int, "position": int, "id": int}
                }
            }
        }
    """

    user_rank_cache: dict = {}

    # ───────────────── ЗАГРУЗКА КЕША ─────────────────

    @staticmethod
    def load_user_rank_cache(username: str, class_code: str) -> dict:
        """
        Загружает из БД рейтинг пользователя в хеш-таблицу.
        БЕЗ ДАТЫ - все данные хранятся в ОДНОЙ записи.
        """
        rank_row = RankNew.query.filter_by(
            username=username,
            class_code=class_code,
        ).first()

        table: dict[int, dict] = {}
        if rank_row:
            for item in rank_row.items:
                table[item.group_id] = {
                    "rating": item.rating,
                    "position": item.position,
                    "id": item.id,
                }

        if username not in RankingService.user_rank_cache:
            RankingService.user_rank_cache[username] = {}
        RankingService.user_rank_cache[username][class_code] = table

        print(f"\n[LOAD_CACHE] username={username}, class_code={class_code}")
        print(f"[LOAD_CACHE] Loaded groups: {list(table.keys())}")
        print(f"[LOAD_CACHE] Cache state: {table}\n")
        return table

    # ───────────────── ОПЕРАЦИИ С КЕШЕМ ─────────────────

    @staticmethod
    def _get_table(username: str, class_code: str) -> dict:
        return RankingService.user_rank_cache.get(username, {}).get(class_code, {})

    @staticmethod
    def add_to_cache(
        username: str,
        class_code: str,
        group_id: int,
        rating: int,
        position: int,
        item_id: int,
    ) -> None:
        if username not in RankingService.user_rank_cache:
            RankingService.user_rank_cache[username] = {}
        if class_code not in RankingService.user_rank_cache[username]:
            RankingService.user_rank_cache[username][class_code] = {}
        RankingService.user_rank_cache[username][class_code][group_id] = {
            "rating": rating,
            "position": position,
            "id": item_id,
        }
        print(
            f"[ADD_CACHE] Added to cache: group_id={group_id}, "
            f"rating={rating}, position={position}"
        )

    @staticmethod
    def update_position_in_cache(
        username: str, class_code: str, group_id: int, new_position: int
    ) -> None:
        table = RankingService._get_table(username, class_code)
        if group_id in table:
            old_pos = table[group_id]["position"]
            table[group_id]["position"] = new_position
            print(f"[UPDATE_POS] group_id={group_id}: {old_pos} → {new_position}")

    # ───────────────── ПОИСК КОНФЛИКТОВ ─────────────────

    @staticmethod
    def get_conflict_groups(
        username: str,
        class_code: str,
        rating: int,
        exclude_group_id: int = None,
    ) -> list[int]:
        table = RankingService._get_table(username, class_code)
        print(f"[CONFLICTS] Looking for conflicts in table: {table}")

        conflicts = [
            gid
            for gid, data in table.items()
            if data.get("rating") == rating
        ]

        print(f"[CONFLICTS] Before exclude: {conflicts}")

        if exclude_group_id is not None:
            conflicts = [gid for gid in conflicts if gid != exclude_group_id]

        print(f"[CONFLICTS] After exclude exclude_group_id={exclude_group_id}: {conflicts}")
        print(f"[CONFLICTS] len(conflicts)={len(conflicts)}")
        return conflicts

    # ───────────────── PAIRWISE + QUICKSORT ─────────────────

    @staticmethod
    def compare_groups_by_pairwise(
        group_a: int, group_b: int, username: str, class_code: str
    ) -> int:
        q1 = f"{group_a},{group_b}"
        q2 = f"{group_b},{group_a}"

        p1 = (
            Pairwise.query.filter_by(
                username=int(username),
                class_code=class_code,
                pairwise_q=q1,
            )
            .order_by(Pairwise.answer_time.desc())
            .first()
        )
        p2 = (
            Pairwise.query.filter_by(
                username=int(username),
                class_code=class_code,
                pairwise_q=q2,
            )
            .order_by(Pairwise.answer_time.desc())
            .first()
        )

        pair = p1 or p2
        if not pair:
            print(f"[CMP] {group_a} vs {group_b}: NO DATA → 0")
            return 0

        if pair.pairwise_q == q1:
            winner = pair.answer
            if winner == group_a:
                print(f"[CMP] {group_a} vs {group_b}: {group_a} WIN (q={q1}) → 1")
                return 1
            if winner == group_b:
                print(f"[CMP] {group_a} vs {group_b}: {group_b} WIN (q={q1}) → -1")
                return -1
            print(f"[CMP] {group_a} vs {group_b}: INVALID → 0")
            return 0
        else:
            winner = pair.answer
            if winner == group_a:
                print(f"[CMP] {group_a} vs {group_b}: {group_a} WIN (q={q2}) → 1")
                return 1
            if winner == group_b:
                print(f"[CMP] {group_a} vs {group_b}: {group_b} WIN (q={q2}) → -1")
                return -1
            print(f"[CMP] {group_a} vs {group_b}: INVALID → 0")
            return 0

    @staticmethod
    def quicksort_groups(groups: list[int], cmp) -> list[int]:
        if len(groups) <= 1:
            print(f"[QUICKSORT] groups={groups} → returning as is")
            return groups[:]

        pivot = groups[len(groups) // 2]
        left: list[int] = []
        mid: list[int] = []
        right: list[int] = []

        print(f"[QUICKSORT] Sorting: groups={groups}, pivot={pivot}")

        for g in groups:
            if g == pivot:
                mid.append(g)
            else:
                c = cmp(g, pivot)
                print(f"[QUICKSORT]   cmp({g}, {pivot}) = {c}")
                if c > 0:
                    left.append(g)
                else:
                    right.append(g)

        print(f"[QUICKSORT]   left={left}, mid={mid}, right={right}")

        result = (
            RankingService.quicksort_groups(left, cmp)
            + mid
            + RankingService.quicksort_groups(right, cmp)
        )

        print(f"[QUICKSORT] Result: {result}")
        return result

    @staticmethod
    def resolve_conflicts_quicksort(
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

        print(f"\n[RESOLVE] conflicts={conflicts}, len={len(conflicts)}")

        if len(conflicts) == 0:
            print("[RESOLVE] No conflicts, returning empty list")
            return conflicts

        def cmp(a: int, b: int) -> int:
            return RankingService.compare_groups_by_pairwise(
                a, b, username=username, class_code=class_code
            )

        sorted_result = RankingService.quicksort_groups(conflicts, cmp)
        print(f"[RESOLVE] Final sorted result: {sorted_result}\n")
        return sorted_result

    # ───────────────── СИНХРОНИЗАЦИЯ С БД ─────────────────

    @staticmethod
    def save_positions_to_db(username: str, class_code: str) -> None:
        table = RankingService._get_table(username, class_code)
        if not table:
            print("[SAVE_DB] table is empty, returning")
            return

        print("\n[SAVE_DB] Saving positions to DB:")
        for group_id, data in table.items():
            item_id = data.get("id")
            if not item_id:
                print(f"[SAVE_DB] group_id={group_id} has no item_id, skipping")
                continue
            item = RankNewItem.query.get(item_id)
            if not item:
                print(f"[SAVE_DB] item_id={item_id} not found, skipping")
                continue
            old_pos = item.position
            item.position = data.get("position", item.position)
            item.updated_at = datetime.now()
            print(f"[SAVE_DB] group_id={group_id}: pos {old_pos} → {item.position}")

        db.session.commit()
        print("[SAVE_DB] Committed to database\n")

    # ───────────────── ОСНОВНАЯ ОПЕРАЦИЯ ─────────────────

    @staticmethod
    def add_group_to_rank(
        username: str,
        class_code: str,
        group_id: int,
        rating: int,
    ) -> dict:
        print("\n" + "=" * 100)
        print(
            f"[ADD_GROUP] START: username={username}, class_code={class_code}, "
            f"group_id={group_id}, rating={rating}"
        )
        print("=" * 100)

        if username not in RankingService.user_rank_cache:
            RankingService.user_rank_cache[username] = {}

        if class_code not in RankingService.user_rank_cache[username]:
            print("[ADD_GROUP] Cache for this class not loaded, loading...")
            RankingService.load_user_rank_cache(username, class_code)

        table = RankingService._get_table(username, class_code)
        print(f"[ADD_GROUP] Current table before adding: {table}")

        if group_id in table:
            print(f"[ADD_GROUP] Group {group_id} already exists in table")
            print("=" * 100 + "\n")
            return {"existing": True, "conflict": False, "sorted_groups": []}

        rank_row = RankNew.query.filter_by(
            username=username,
            class_code=class_code,
        ).first()
        if not rank_row:
            rank_row = RankNew(
                username=username,
                class_code=class_code,
            )
            db.session.add(rank_row)
            db.session.flush()
            print("[ADD_GROUP] Created new RankNew row")

        next_position = len(table) + 1
        item = RankNewItem(
            rank_new_id=rank_row.id,
            group_id=group_id,
            rating=rating,
            class_code=class_code,
            position=next_position,
        )
        db.session.add(item)
        db.session.flush()
        print(
            f"[ADD_GROUP] Created RankNewItem: group_id={group_id}, "
            f"initial position={next_position}, class_code={class_code}"
        )

        RankingService.add_to_cache(
            username=username,
            class_code=class_code,
            group_id=group_id,
            rating=rating,
            position=next_position,
            item_id=item.id,
        )
        db.session.commit()
        print("[ADD_GROUP] Added to cache and committed to DB")

        print(
            f"\n[ADD_GROUP] Checking for conflicts with rating={rating}, "
            f"exclude_group_id={group_id}..."
        )
        conflicts = RankingService.get_conflict_groups(
            username=username,
            class_code=class_code,
            rating=rating,
            exclude_group_id=None,
        )

        print("\n[ADD_GROUP] CONFLICT CHECK RESULT:")
        print(f"[ADD_GROUP]   conflicts={conflicts}")
        print(f"[ADD_GROUP]   len(conflicts)={len(conflicts)}")
        print(f"[ADD_GROUP]   len(conflicts) == 0 → {len(conflicts) == 0}")

        if len(conflicts) == 0:
            print("[ADD_GROUP] NO CONFLICTS! Returning conflict=False")
            print("=" * 100 + "\n")
            return {"existing": False, "conflict": False, "sorted_groups": []}

        print("[ADD_GROUP] CONFLICTS FOUND! Continuing to resolution...")

        sorted_ids = RankingService.resolve_conflicts_quicksort(
            username=username,
            class_code=class_code,
            rating=rating,
            exclude_group_id=group_id,
        )

        print("\n[ADD_GROUP] After sorting:")
        print(f"[ADD_GROUP]   sorted_ids={sorted_ids}")
        print(f"[ADD_GROUP]   len(sorted_ids)={len(sorted_ids)}")

        if len(sorted_ids) == 0:
            print("[ADD_GROUP] WARNING: sorted_ids is empty!")
            print("=" * 100 + "\n")
            return {"existing": False, "conflict": False, "sorted_groups": []}

        print("\n[ADD_GROUP] Reassigning positions for sorted groups...")
        for pos, gid in enumerate(sorted_ids, start=1):
            RankingService.update_position_in_cache(
                username=username,
                class_code=class_code,
                group_id=gid,
                new_position=pos,
            )

        final_position_for_current = len(sorted_ids) + 1
        print(
            f"[ADD_GROUP] Setting current group_id={group_id} "
            f"to position {final_position_for_current}"
        )
        RankingService.update_position_in_cache(
            username=username,
            class_code=class_code,
            group_id=group_id,
            new_position=final_position_for_current,
        )

        RankingService.save_positions_to_db(username, class_code)

        print("[ADD_GROUP] FINAL CACHE STATE:")
        RankingService.print_cache(username, class_code)

        print(f"[ADD_GROUP] RETURNING: conflict=True, sorted_groups={sorted_ids}")
        print("=" * 100 + "\n")

        return {"existing": False, "conflict": True, "sorted_groups": sorted_ids}

    @staticmethod
    def print_cache(username: str, class_code: str) -> None:
        table = RankingService._get_table(username, class_code)
        print(f"[CACHE] Cache state for username={username}, class_code={class_code}:")
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
