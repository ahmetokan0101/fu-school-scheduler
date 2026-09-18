from app.scheduling.interfaces import AssignedEntry, CourseInfo, SchedulingInput, SchedulingResult


class FeasibilityChecker:
    def check(self, input: SchedulingInput) -> SchedulingResult | None:
        result = self._check_class_overcommit(input)
        if result:
            return result

        result = self._check_teacher_overcommit(input)
        if result:
            return result

        result = self._check_teacher_availability_insufficient(input)
        if result:
            return result

        return None

    def _check_class_overcommit(self, input: SchedulingInput) -> SchedulingResult | None:
        class_hours: dict = {}
        for course in input.courses:
            class_hours[course.class_group_id] = (
                class_hours.get(course.class_group_id, 0) + course.weekly_hours
            )

        class_map = {cg.id: cg.name for cg in input.class_groups}

        for cg_id, total in class_hours.items():
            if total > 35:
                name = class_map.get(cg_id, str(cg_id))
                return SchedulingResult(
                    success=False,
                    entries=[],
                    infeasibility_type="CLASS_OVERCOMMIT",
                    human_message=(
                        f"{name} sınıfı için haftalık {total} ders saati gerekiyor fakat haftada toplam 35 saat bulunmaktadır."
                    ),
                    conflicts=[
                        {
                            "entity": f"Sınıf:{name}",
                            "description": f"Toplam haftalık saat ({total}) > 35",
                            "suggestion": "Bu sınıftaki derslerden birinin haftalık saatini azaltın.",
                        }
                    ],
                )
        return None

    def _check_teacher_overcommit(self, input: SchedulingInput) -> SchedulingResult | None:
        teacher_hours: dict = {}
        for course in input.courses:
            teacher_hours[course.teacher_id] = (
                teacher_hours.get(course.teacher_id, 0) + course.weekly_hours
            )

        teacher_map = {t.id: t for t in input.teachers}

        for t_id, total in teacher_hours.items():
            teacher = teacher_map.get(t_id)
            if teacher is None:
                continue
            available = len(teacher.available_slot_ids)
            if total > available:
                return SchedulingResult(
                    success=False,
                    entries=[],
                    infeasibility_type="TEACHER_OVERCOMMIT",
                    human_message=(
                        f"{teacher.name} öğretmenine {total} saat ders atanmış ancak yalnızca "
                        f"{available} saat müsaitliği bulunmaktadır."
                    ),
                    conflicts=[
                        {
                            "entity": f"Öğretmen:{teacher.name}",
                            "description": f"Atanan saat ({total}) > müsait saat sayısı ({available})",
                            "suggestion": "Öğretmenin müsait saatlerini artırın veya atanan ders saatlerini azaltın.",
                        }
                    ],
                )
        return None

    def _check_teacher_availability_insufficient(
        self, input: SchedulingInput
    ) -> SchedulingResult | None:
        teacher_map = {t.id: t for t in input.teachers}

        for course in input.courses:
            teacher = teacher_map.get(course.teacher_id)
            if teacher is None:
                continue
            available = len(teacher.available_slot_ids)
            if course.weekly_hours > available:
                return SchedulingResult(
                    success=False,
                    entries=[],
                    infeasibility_type="TEACHER_AVAILABILITY_INSUFFICIENT",
                    human_message=(
                        f"{teacher.name} öğretmeninin bu dersi karşılayacak yeterli müsait saati bulunmuyor."
                    ),
                    conflicts=[
                        {
                            "entity": f"Öğretmen:{teacher.name}",
                            "description": (
                                f"Ders {course.weekly_hours} saat gerektiriyor fakat öğretmenin "
                                f"yalnızca {available} saat müsaitliği var."
                            ),
                            "suggestion": (
                                "Öğretmene daha fazla müsait saat ekleyin veya "
                                "dersin haftalık saatini düşürün."
                            ),
                        }
                    ],
                )
        return None
