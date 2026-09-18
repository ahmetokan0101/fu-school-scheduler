from ortools.sat.python import cp_model

from app.scheduling.feasibility_checker import FeasibilityChecker
from app.scheduling.interfaces import (
    AssignedEntry,
    IScheduler,
    SchedulingInput,
    SchedulingResult,
)


class ORToolsScheduler(IScheduler):
    def solve(self, input: SchedulingInput) -> SchedulingResult:
        early = FeasibilityChecker().check(input)
        if early is not None:
            return early

        model = cp_model.CpModel()

        x: dict = {}
        for course in input.courses:
            for slot in input.slots:
                x[(course.id, slot.id)] = model.new_bool_var(
                    f"x_{course.id}_{slot.id}"
                )

        teacher_available: dict[object, set] = {
            t.id: t.available_slot_ids for t in input.teachers
        }

        # C1 — teacher unavailability
        for course in input.courses:
            available = teacher_available.get(course.teacher_id, set())
            for slot in input.slots:
                if slot.id not in available:
                    model.add(x[(course.id, slot.id)] == 0)

        # C2 — teacher teaches at most one course per slot
        teacher_courses: dict = {}
        for course in input.courses:
            teacher_courses.setdefault(course.teacher_id, []).append(course.id)

        for t_id, course_ids in teacher_courses.items():
            for slot in input.slots:
                model.add_at_most_one(x[(c_id, slot.id)] for c_id in course_ids)

        # C3 — class has at most one course per slot
        class_courses: dict = {}
        for course in input.courses:
            class_courses.setdefault(course.class_group_id, []).append(course.id)

        for cg_id, course_ids in class_courses.items():
            for slot in input.slots:
                model.add_at_most_one(x[(c_id, slot.id)] for c_id in course_ids)

        # Group slots by day ordered by period
        slots_by_day: dict[object, list] = {}
        for slot in input.slots:
            slots_by_day.setdefault(slot.day, []).append(slot)
        for day_slots in slots_by_day.values():
            day_slots.sort(key=lambda s: s.period)

        # C4 — each course runs exactly weekly_hours times
        for course in input.courses:
            model.add(
                sum(x[(course.id, slot.id)] for slot in input.slots) == course.weekly_hours
            )

        # C5 — A class has at most 2 hours of the same course on any single day
        # C6 — Block Lesson: When a course has 2 hours on a day, they MUST be consecutive (adjacent)
        pair_vars = []
        for course in input.courses:
            for day, day_slots in slots_by_day.items():
                day_slot_vars = [x[(course.id, s.id)] for s in day_slots]
                daily_sum = sum(day_slot_vars)

                # At most 2 hours per day
                model.add(daily_sum <= 2)

                # If day has 2 or more periods, enforce block adjacent pair constraint
                if len(day_slots) >= 2:
                    is_two = model.new_bool_var(f"is2_{course.id}_{day}")
                    model.add(daily_sum == 2).only_enforce_if(is_two)
                    model.add(daily_sum <= 1).only_enforce_if(is_two.Not())

                    pairs_in_day = []
                    for i in range(len(day_slots) - 1):
                        p_var = model.new_bool_var(f"pair_{course.id}_{day}_{i}")
                        s1, s2 = day_slots[i], day_slots[i + 1]
                        model.add_bool_and([x[(course.id, s1.id)], x[(course.id, s2.id)]]).only_enforce_if(p_var)
                        model.add_bool_or([x[(course.id, s1.id)].Not(), x[(course.id, s2.id)].Not()]).only_enforce_if(p_var.Not())
                        pairs_in_day.append(p_var)
                        pair_vars.append(p_var)

                    # When daily_sum == 2, exactly one adjacent pair must be active!
                    model.add(sum(pairs_in_day) == is_two)

        # Objective: Maximize block groupings (2-hour blocks)
        if pair_vars:
            model.maximize(sum(pair_vars))

        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = 10.0
        solver.parameters.num_workers = 4

        status = solver.solve(model)

        if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            entries = [
                AssignedEntry(course_id=c_id, slot_id=s_id)
                for (c_id, s_id), var in x.items()
                if solver.value(var) == 1
            ]
            return SchedulingResult(success=True, entries=entries)

        if status == cp_model.INFEASIBLE:
            return SchedulingResult(
                success=False,
                infeasibility_type="SOLVER_UNSAT",
                human_message=(
                    "Mevcut yapılandırma ve kısıtlarla geçerli bir ders programı oluşturulamadı. "
                    "Öğretmenlerin müsaitlik durumlarını veya ders saatlerini ayarlamayı deneyin."
                ),
                conflicts=[],
            )

        # UNKNOWN → timeout
        return SchedulingResult(
            success=False,
            infeasibility_type="SOLVER_TIMEOUT",
            human_message=(
                "Ders programı oluşturma işlemi 10 saniye sonra zaman aşımına uğradı. "
                "Ders veya kısıt sayısını azaltmayı deneyin."
            ),
            conflicts=[],
        )
