from core.types import Referee, Performance, Assessment
from sqlmodel import Session, select, func, delete
from data.database import engine
from typing import Dict, List, Optional
from collections import defaultdict
from core.types import Rating, Types
import json

class StrictnessConfig:
    """Настройки профиля строгости"""
    # Базовые пороги (можно менять через дашборд)
    OVER_THRESHOLD = 0.15    # баллов
    UNDER_THRESHOLD = -0.15  # баллов
    
    # Для разных уровней можно отдельно
    LEVEL_MULTIPLIERS = {
        'weak': 1.2,     # слабым разрешим чуть больше завышать
        'medium': 1.0,
        'strong': 0.8    # сильным строже
    }
    
    @classmethod
    def get_threshold(cls, level: str, direction: str) -> float:
        mult = cls.LEVEL_MULTIPLIERS.get(level, 1.0)
        if direction == 'over':
            return cls.OVER_THRESHOLD * mult
        else:
            return cls.UNDER_THRESHOLD * mult

class DispersionService:
    def __init__(self):
        self.engine = engine

    def get_accuracy_category(self, referee_score: float, final_score: float) -> str:
        """
        Определяет категорию точности оценки судьи.
        Возвращает: 'bullseye', 'acceptable', 'serious'
        """
        deviation = abs(referee_score - final_score)
        
        # В яблочко
        if deviation == 0:
            return 'bullseye'
        
        # Определяем допустимое отклонение по итоговой оценке
        if final_score >= 8.0:
            allowed = 0.3
        elif final_score >= 7.0:
            allowed = 0.4
        elif final_score >= 6.0:
            allowed = 0.5
        else:
            allowed = 0.6
        
        if deviation <= allowed:
            return 'acceptable'
        else:
            return 'serious'

    def is_within_tolerance(self, referee_score: float, final_score: float) -> bool:
        """Проверяет, находится ли оценка в допустимом диапазоне"""
        category = self.get_accuracy_category(referee_score, final_score)
        return category in ['bullseye', 'acceptable']

    def calculate_overall_rating_with_bias(self, referee_stats: Dict) -> float:
        """
        Рейтинг с штрафом за предвзятость
        Учитывает только категории, где есть оценки
        """
        # Собираем данные только по категориям с оценками
        available_categories = []
        weights = []
        
        for category in ['execution', 'artistic']:
            total = referee_stats[category]['total']
            if total > 0:
                available_categories.append(category)
                # Вес пропорционален количеству оценок
                weights.append(total)
        
        if not available_categories:
            return 0  # нет данных
        
        # Нормализуем веса (сумма = 1)
        total_weight = sum(weights)
        weights = [w / total_weight for w in weights]
        
        # Взвешенная базовая точность
        base_rating = 0
        avg_bias = 0
        
        for i, category in enumerate(available_categories):
            rate = referee_stats[category]['accuracy_rate']
            base_rating += rate * weights[i]
            
            bias = abs(referee_stats[category]['bias'])
            avg_bias += bias * weights[i]
        
        # Штраф за предвзятость
        bias_penalty = min(avg_bias * 0.5, 0.3)
        
        final_rating = (base_rating - bias_penalty) * 100
        
        return round(max(0, min(100, final_rating)), 1)
    def calc_rating(self) -> Dict:
        """
        Получает статистику по всем судьям: точность и предвзятость
        Раздельно для EXECUTION и ARTISTIC
        """
        with Session(self.engine) as session:
            session.exec(delete(Rating))
            session.commit()
            # Загружаем все данные с JOIN
            stmt = select(Referee, Assessment, Performance).join(
                Assessment, Assessment.referee_id == Referee.id
            ).join(
                Performance, Assessment.performance_id == Performance.id
            )
            
            results = session.exec(stmt).all()
            
            # Структура для хранения статистики
            referee_stats = {}
            
            for referee, assessment, performance in results:
                # Инициализация структуры для судьи
                if referee.id not in referee_stats:
                    referee_stats[referee.id] = {
                        'id': referee.id,
                        'name': referee.fio,
                        'region': referee.region,
                        'city': referee.city,
                        'execution': {
                            'total': 0,
                            'bullseye': 0,
                            'acceptable': 0,
                            'serious': 0,
                            'deviation_sum': 0.0,  # для расчета среднего отклонения
                            'bias_own_sum': 0.0,
                            'bias_own_count': 0,
                            'bias_other_sum': 0.0,
                            'bias_other_count': 0
                        },
                        'artistic': {
                            'total': 0,
                            'bullseye': 0,
                            'acceptable': 0,
                            'serious': 0,
                            'deviation_sum': 0.0,
                            'bias_own_sum': 0.0,
                            'bias_own_count': 0,
                            'bias_other_sum': 0.0,
                            'bias_other_count': 0
                        }
                    }
                
                # Определяем тип оценки и выбираем соответствующую структуру
                if assessment.type == 'EXECUTION':
                    stats_type = referee_stats[referee.id]['execution']
                elif assessment.type == 'ARTISTIC':
                    stats_type = referee_stats[referee.id]['artistic']
                else:
                    continue  # Игнорируем другие типы
                
                # Увеличиваем счетчик
                stats_type['total'] += 1
                
                # 1. Анализ точности
                deviation = assessment.referee_assessment - assessment.result_type_assessment
                stats_type['deviation_sum'] += deviation
                
                accuracy_category = self.get_accuracy_category(
                    assessment.referee_assessment, 
                    assessment.result_type_assessment
                )
                stats_type[accuracy_category] += 1
                
                # 2. Анализ предвзятости
                # Определяем, является ли спортсмен "своим"
                is_own = False
                if performance.competition_type == "RUSSIA":
                    is_own = (performance.region == referee.region)
                elif performance.competition_type == "REGION":
                    is_own = (performance.city == referee.city)
                # Для городских соревнований (если появятся) - по city или клубу
                else:
                    is_own = (performance.city == referee.city)
                
                # Добавляем отклонение в соответствующую корзину
                if is_own:
                    stats_type['bias_own_sum'] += deviation
                    stats_type['bias_own_count'] += 1
                else:
                    stats_type['bias_other_sum'] += deviation
                    stats_type['bias_other_count'] += 1
            
            # Финальные расчеты для каждого судьи
            for referee_id, stats in referee_stats.items():
                for assessment_type in ['execution', 'artistic']:
                    data = stats[assessment_type]
                    
                    if data['total'] > 0:
                        # Процент точности (bullseye + acceptable)
                        data['accuracy_rate'] = (
                            (data['bullseye'] + data['acceptable']) / data['total']
                        )
                        
                        # Процент попадания в яблочко
                        data['bullseye_rate'] = data['bullseye'] / data['total']
                        
                        # Среднее отклонение
                        data['avg_deviation'] = data['deviation_sum'] / data['total']
                        
                        # Предвзятость
                        avg_own = (data['bias_own_sum'] / data['bias_own_count'] 
                                  if data['bias_own_count'] > 0 else 0)
                        avg_other = (data['bias_other_sum'] / data['bias_other_count'] 
                                    if data['bias_other_count'] > 0 else 0)
                        data['bias'] = avg_other - avg_own
                        
                        # Интерпретация предвзятости
                        if abs(data['bias']) < 0.05:
                            data['bias_interpretation'] = 'Объективен'
                        elif data['bias'] < 0:
                            data['bias_interpretation'] = f'Завышает своим на {abs(data["bias"]):.2f}'
                        else:
                            data['bias_interpretation'] = f'Завышает чужим на {data["bias"]:.2f}'
                    else:
                        data['accuracy_rate'] = 0
                        data['bullseye_rate'] = 0
                        data['avg_deviation'] = 0
                        data['bias'] = 0
                        data['bias_interpretation'] = 'Нет данных'
            
            data = [Rating(referee_id=referee_stats[i]["id"], 
                        execution=json.dumps(referee_stats[i]["execution"]), 
                        artistic=json.dumps(referee_stats[i]["artistic"]),
                        rating=self.calculate_overall_rating_with_bias(referee_stats[i]))
                        
                    for i in referee_stats]
            session.add_all(data)
            session.commit()

    def get_competition_stats(self) -> Dict:
        """
        Статистика по соревнованиям (раздел 5.1)
        """
        with Session(self.engine) as session:
            stmt = select(Referee, Assessment, Performance).join(
                Assessment, Assessment.referee_id == Referee.id
            ).join(
                Performance, Assessment.performance_id == Performance.id
            )
            
            results = session.exec(stmt).all()
            
            competition_stats = defaultdict(lambda: {
                'execution': {'total': 0, 'within_tolerance': 0},
                'artistic': {'total': 0, 'within_tolerance': 0}
            })
            
            for referee, assessment, performance in results:
                comp_name = performance.competition
                
                if assessment.type == 'EXECUTION':
                    stats_type = competition_stats[comp_name]['execution']
                elif assessment.type == 'ARTISTIC':
                    stats_type = competition_stats[comp_name]['artistic']
                else:
                    continue
                
                stats_type['total'] += 1
                if self.is_within_tolerance(
                    assessment.referee_assessment, 
                    assessment.result_type_assessment
                ):
                    stats_type['within_tolerance'] += 1
            
            # Расчет процентов
            for comp_name, stats in competition_stats.items():
                for assessment_type in ['execution', 'artistic']:
                    total = stats[assessment_type]['total']
                    within = stats[assessment_type]['within_tolerance']
                    stats[assessment_type]['percentage'] = (
                        (within / total * 100) if total > 0 else 0
                    )
            
            return dict(competition_stats)

    def get_referee_assessments_list(
        self, 
        referee_id: int, 
        assessment_type: str = None,
        discipline: str = None,
        age_category: str = None,
        competition: str = None
    ) -> List[Dict]:
        """
        Список оценок судьи для детального просмотра (раздел 5.5)
        """
        with Session(self.engine) as session:
            # Базовый запрос
            stmt = select(Assessment, Performance).join(
                Performance, Assessment.performance_id == Performance.id
            ).where(Assessment.referee_id == referee_id)
            
            # Применяем фильтры
            if assessment_type:
                stmt = stmt.where(Assessment.type == assessment_type)
            if discipline:
                stmt = stmt.where(Performance.discipline == discipline)
            if age_category:
                stmt = stmt.where(Performance.age_category == age_category)
            if competition:
                stmt = stmt.where(Performance.competition == competition)
            
            results = session.exec(stmt).all()
            
            assessments_list = []
            for assessment, performance in results:
                # Находим три другие оценки по этому выступлению и типу
                other_scores_stmt = select(Assessment.referee_assessment).where(
                    Assessment.performance_id == performance.id,
                    Assessment.type == assessment.type,
                    Assessment.referee_id != referee_id
                ).limit(3)
                other_scores = session.exec(other_scores_stmt).all()
                
                deviation = assessment.referee_assessment - assessment.result_type_assessment
                accuracy_category = self.get_accuracy_category(
                    assessment.referee_assessment,
                    assessment.result_type_assessment
                )
                
                # Цвет для отображения
                color_map = {
                    'bullseye': 'green',
                    'acceptable': 'yellow',
                    'serious': 'red'
                }
                
                assessments_list.append({
                    'performance_id': performance.id,
                    'competition': performance.competition,
                    'discipline': performance.discipline,
                    'age_category': performance.age_category,
                    'referee_score': assessment.referee_assessment,
                    'other_scores': other_scores,
                    'final_score': assessment.result_type_assessment,
                    'deviation': deviation,
                    'accuracy_category': accuracy_category,
                    'accuracy_color': color_map[accuracy_category],
                    'assessment_type': assessment.type
                })
            
            return assessments_list

    def get_referee_region_heatmap(self, referee_id: int) -> Dict:
        """
        Тепловая карта "Судья x Регионы" для обоих типов оценок (раздел 5.3)
        Возвращает:
        {
            'execution': {'Москва': 0.09, 'СПб': -0.075, ...},
            'artistic': {'Москва': 0.05, 'СПб': -0.02, ...}
        }
        """
        with Session(self.engine) as session:
            stmt = select(Assessment, Performance).join(
                Performance, Assessment.performance_id == Performance.id
            ).where(
                Assessment.referee_id == referee_id
            )
            
            results = session.exec(stmt).all()
            
            # Структура для хранения статистики по типам оценок
            heatmap_data = {
                'execution': defaultdict(lambda: {'sum': 0.0, 'count': 0}),
                'artistic': defaultdict(lambda: {'sum': 0.0, 'count': 0})
            }
            
            for assessment, performance in results:
                # Определяем тип оценки
                if assessment.type == 'EXECUTION':
                    stats_type = heatmap_data['execution']
                elif assessment.type == 'ARTISTIC':
                    stats_type = heatmap_data['artistic']
                else:
                    continue
                
                region = performance.region
                deviation = assessment.referee_assessment - assessment.result_type_assessment
                
                stats_type[region]['sum'] += deviation
                stats_type[region]['count'] += 1
            
            # Расчет средних отклонений
            result = {}
            for assessment_type in ['execution', 'artistic']:
                result[assessment_type] = {}
                for region, stats in heatmap_data[assessment_type].items():
                    avg_deviation = stats['sum'] / stats['count'] if stats['count'] > 0 else 0
                    # Округляем до 3 знаков для удобства
                    result[assessment_type][region] = round(avg_deviation, 3)
            
            return result

    def get_category_stats(self, competition: str, category: str = None) -> Dict:
        """
        Статистика по категории выступлений (раздел 5.2)
        """
        with Session(self.engine) as session:
            stmt = select(Performance, Assessment, Referee).join(
                Assessment, Assessment.performance_id == Performance.id
            ).join(
                Referee, Assessment.referee_id == Referee.id
            ).where(Performance.competition == competition)
            
            if category:
                # category может быть "age_category+discipline"
                pass
            
            results = session.exec(stmt).all()
            
            category_stats = defaultdict(lambda: {
                'judges_scores': defaultdict(list),
                'bias_scores': []
            })
            
            for performance, assessment, referee in results:
                key = f"{performance.age_category}|{performance.discipline}"
                
                # Собираем оценки по номерам судей
                category_stats[key]['judges_scores'][assessment.number].append(
                    assessment.referee_assessment
                )
                
                # Расчет предвзятости по категории
                is_own = False
                if performance.competition_type == "RUSSIA":
                    is_own = (performance.region == referee.region)
                elif performance.competition_type == "REGION":
                    is_own = (performance.city == referee.city)
                
                deviation = assessment.referee_assessment - assessment.result_type_assessment
                category_stats[key]['bias_scores'].append({
                    'deviation': deviation,
                    'is_own': is_own
                })
            
            # Агрегируем результаты
            result = {}
            for key, data in category_stats.items():
                age_category, discipline = key.split('|')
                
                # Средние оценки каждого судьи
                avg_judge_scores = {}
                for judge_num, scores in data['judges_scores'].items():
                    avg_judge_scores[judge_num] = sum(scores) / len(scores) if scores else 0
                
                # Коэффициент предвзятости
                own_devs = [d['deviation'] for d in data['bias_scores'] if d['is_own']]
                other_devs = [d['deviation'] for d in data['bias_scores'] if not d['is_own']]
                
                avg_own = sum(own_devs) / len(own_devs) if own_devs else 0
                avg_other = sum(other_devs) / len(other_devs) if other_devs else 0
                bias_coefficient = avg_other - avg_own
                
                result[f"{discipline} - {age_category}"] = {
                    'age_category': age_category,
                    'discipline': discipline,
                    'avg_judge_scores': avg_judge_scores,
                    'bias_coefficient': bias_coefficient
                }
            
            return result
        
    def get_referee_stats(self, ref_id):
        try:
            with Session(self.engine) as session:
                data = session.exec(select(Rating).where(Rating.referee_id == ref_id)).all()
                return data

        except Exception as e:
            print(repr(e))
            return None
    def get_average_tolerance_percentage(self) -> Dict:
        """
        Рассчитывает средний % попадания в допустимое отклонение по ВСЕМ соревнованиям
        Возвращает:
        {
            'execution': 78.5,  # средний % по исполнению
            'artistic': 72.3,   # средний % по артистизму
            'by_competition': {  # детализация по каждому соревнованию
                'Competition 1': {'execution': 80.0, 'artistic': 75.0},
                'Competition 2': {'execution': 77.0, 'artistic': 70.0}
            }
        }
        """
        with Session(self.engine) as session:
            # Загружаем все оценки с информацией о соревнованиях
            stmt = select(Assessment, Performance).join(
                Performance, Assessment.performance_id == Performance.id
            )
            
            results = session.exec(stmt).all()
            
            # Структура для сбора статистики по соревнованиям
            competition_stats = defaultdict(lambda: {
                'execution': {'within': 0, 'total': 0},
                'artistic': {'within': 0, 'total': 0}
            })
            
            for assessment, performance in results:
                comp_name = performance.competition
                
                # Определяем тип оценки
                if assessment.type == Types.EXECUTION:
                    stats_type = competition_stats[comp_name]['execution']
                elif assessment.type == Types.ARTISTIC:
                    stats_type = competition_stats[comp_name]['artistic']
                else:
                    continue
                
                # Проверяем, попадает ли оценка в допустимое отклонение
                is_within = self.is_within_tolerance(
                    assessment.referee_assessment,
                    assessment.result_type_assessment
                )
                
                stats_type['total'] += 1
                if is_within:
                    stats_type['within'] += 1
            
            # Рассчитываем проценты по каждому соревнованию
            by_competition = {}
            total_execution_within = 0
            total_execution_all = 0
            total_artistic_within = 0
            total_artistic_all = 0
            
            for comp_name, stats in competition_stats.items():
                exec_stats = stats['execution']
                art_stats = stats['artistic']
                
                exec_percent = (exec_stats['within'] / exec_stats['total'] * 100) if exec_stats['total'] > 0 else 0
                art_percent = (art_stats['within'] / art_stats['total'] * 100) if art_stats['total'] > 0 else 0
                
                by_competition[comp_name] = {
                    'execution': round(exec_percent, 1),
                    'artistic': round(art_percent, 1),
                    'execution_count': exec_stats['total'],
                    'artistic_count': art_stats['total']
                }
                
                # Суммируем для общего среднего
                total_execution_within += exec_stats['within']
                total_execution_all += exec_stats['total']
                total_artistic_within += art_stats['within']
                total_artistic_all += art_stats['total']
            
            # Общие средние проценты по всем соревнованиям
            avg_execution = (total_execution_within / total_execution_all * 100) if total_execution_all > 0 else 0
            avg_artistic = (total_artistic_within / total_artistic_all * 100) if total_artistic_all > 0 else 0
            
            return {
                'execution': round(avg_execution, 1),
                'artistic': round(avg_artistic, 1),
                'by_competition': by_competition,
                'total_assessments': {
                    'execution': total_execution_all,
                    'artistic': total_artistic_all
                }
            }
    
    
    def get_competition_detail_stats(self, competition_name: str) -> Dict:
        """
        Детальная статистика по соревнованию (раздел 5.2)
        """
        with Session(self.engine) as session:
            # Загружаем данные
            stmt = select(Performance, Assessment, Referee).join(
                Assessment, Assessment.performance_id == Performance.id
            ).join(
                Referee, Assessment.referee_id == Referee.id
            ).where(Performance.competition == competition_name)
            
            results = session.exec(stmt).all()
            
            # Структуры для сбора данных
            disciplines = set()
            age_categories = set()
            categories = {}
            
            # Для расчета общих индикаторов
            exec_within = 0
            exec_total = 0
            art_within = 0
            art_total = 0
            
            # Для коэффициента девиации:
            # Группируем отклонения по выступлениям
            performance_max_deviations = {}  # {performance_id: {'execution': max_dev, 'artistic': max_dev}}
            
            for performance, assessment, referee in results:
                # Собираем уникальные значения
                disciplines.add(performance.discipline)
                age_categories.add(performance.age_category)
                
                # Группируем по категориям
                cat_key = f"{performance.age_category}|{performance.discipline}"
                if cat_key not in categories:
                    categories[cat_key] = {
                        'age_category': performance.age_category,
                        'discipline': performance.discipline,
                        'assessments': [],
                        'judge_scores': {},
                        'bias_data': {'own': [], 'other': []}
                    }
                
                # Сохраняем оценку для категории
                deviation = assessment.referee_assessment - assessment.result_type_assessment
                abs_deviation = abs(deviation)
                
                categories[cat_key]['assessments'].append({
                    'referee_id': referee.id,
                    'referee_number': assessment.number,
                    'type': assessment.type,
                    'score': assessment.referee_assessment,
                    'final': assessment.result_type_assessment,
                    'deviation': deviation,
                    'abs_deviation': abs_deviation,
                    'region': performance.region,
                    'city': performance.city,
                    'referee_region': referee.region,
                    'referee_city': referee.city,
                    'competition_type': performance.competition_type,
                    'performance_id': performance.id
                })
                
                # ====== Расчет точности (общие индикаторы) ======
                if assessment.type == 'EXECUTION':
                    exec_total += 1
                    if self.is_within_tolerance(assessment.referee_assessment, assessment.result_type_assessment):
                        exec_within += 1
                elif assessment.type == 'ARTISTIC':
                    art_total += 1
                    if self.is_within_tolerance(assessment.referee_assessment, assessment.result_type_assessment):
                        art_within += 1
                
                # ====== Для коэффициента девиации ======
                # Инициализируем структуру для выступления, если ещё нет
                if performance.id not in performance_max_deviations:
                    performance_max_deviations[performance.id] = {
                        'execution': 0,
                        'artistic': 0
                    }
                
                # Обновляем максимальное отклонение для этого выступления
                if assessment.type == 'EXECUTION':
                    if abs_deviation > performance_max_deviations[performance.id]['execution']:
                        performance_max_deviations[performance.id]['execution'] = abs_deviation
                elif assessment.type == 'ARTISTIC':
                    if abs_deviation > performance_max_deviations[performance.id]['artistic']:
                        performance_max_deviations[performance.id]['artistic'] = abs_deviation
            
            # ====== Расчет общих индикаторов ======
            exec_percent = (exec_within / exec_total * 100) if exec_total > 0 else 0
            art_percent = (art_within / art_total * 100) if art_total > 0 else 0
            
            # ====== Расчет коэффициента девиации для соревнования ======
            # Собираем все максимальные отклонения по выступлениям
            execution_max_deviations = []
            artistic_max_deviations = []
            
            for perf_id, deviations in performance_max_deviations.items():
                if deviations['execution'] > 0:
                    execution_max_deviations.append(deviations['execution'])
                if deviations['artistic'] > 0:
                    artistic_max_deviations.append(deviations['artistic'])
            
            # Коэффициент девиации = среднее арифметическое максимальных отклонений
            execution_deviation_coef = sum(execution_max_deviations) / len(execution_max_deviations) if execution_max_deviations else 0
            artistic_deviation_coef = sum(artistic_max_deviations) / len(artistic_max_deviations) if artistic_max_deviations else 0
            
            # Общий коэффициент девиации (средний между исполнением и артистизмом)
            overall_deviation_coef = (execution_deviation_coef + artistic_deviation_coef) / 2
            
            # ====== Расчет статистики по категориям ======
            categories_stats = {}
            for cat_key, cat_data in categories.items():
                # Средние оценки каждого судьи по номерам
                judge_scores = {}
                for assessment in cat_data['assessments']:
                    judge_num = assessment['referee_number']
                    if judge_num not in judge_scores:
                        judge_scores[judge_num] = {'sum': 0, 'count': 0}
                    judge_scores[judge_num]['sum'] += assessment['score']
                    judge_scores[judge_num]['count'] += 1
                
                # Усредняем
                for judge_num in judge_scores:
                    judge_scores[judge_num] = round(judge_scores[judge_num]['sum'] / judge_scores[judge_num]['count'], 2)
                
                # Коэффициент предвзятости по категории
                own_deviations = []
                other_deviations = []
                
                for assessment in cat_data['assessments']:
                    # Определяем "свой/чужой"
                    is_own = False
                    if assessment['competition_type'] == 'RUSSIA':
                        is_own = (assessment['region'] == assessment['referee_region'])
                    elif assessment['competition_type'] == 'REGION':
                        is_own = (assessment['city'] == assessment['referee_city'])
                    
                    deviation = assessment['deviation']
                    if is_own:
                        own_deviations.append(deviation)
                    else:
                        other_deviations.append(deviation)
                
                avg_own = sum(own_deviations) / len(own_deviations) if own_deviations else 0
                avg_other = sum(other_deviations) / len(other_deviations) if other_deviations else 0
                bias_coefficient = avg_other - avg_own
                
                categories_stats[cat_key] = {
                    'age_category': cat_data['age_category'],
                    'discipline': cat_data['discipline'],
                    'avg_judge_scores': judge_scores,
                    'bias_coefficient': round(bias_coefficient, 3),
                    'assessments_count': len(cat_data['assessments'])
                }
            
            return {
                'competition': competition_name,
                'disciplines': sorted(list(disciplines)),
                'age_categories': sorted(list(age_categories)),
                'overall': {
                    'execution_tolerance_percentage': round(exec_percent, 1),
                    'artistic_tolerance_percentage': round(art_percent, 1),
                    'deviation_coefficient': {
                        'execution': round(execution_deviation_coef, 3),
                        'artistic': round(artistic_deviation_coef, 3),
                        'overall': round(overall_deviation_coef, 3)
                    }
                },
                'categories': categories_stats
            }

    def get_strictness_verdict(self, avg_deviation: float, level: str) -> str:
        """
        Возвращает 'завышает', 'занижает' или 'объективен'
        """
        # Получаем пороги для уровня
        over_th = StrictnessConfig.get_threshold(level, 'over')
        under_th = StrictnessConfig.get_threshold(level, 'under')
        
        if avg_deviation > over_th:
            return 'завышает'
        elif avg_deviation < under_th:
            return 'занижает'
        else:
            return 'объективен'

    def get_strictness_profile(self, referee_id: int) -> Dict:
        """
        Анализ строгости для обеих категорий оценок
        Возвращает профиль для EXECUTION и ARTISTIC отдельно
        
        Пример результата:
        {
            'execution': {
                'weak': {'avg_deviation': 0.12, 'verdict': 'завышает', 'count': 5, 'severity': 0.12},
                'medium': {'avg_deviation': -0.03, 'verdict': 'объективен', 'count': 12, 'severity': 0.03},
                'strong': {'avg_deviation': -0.15, 'verdict': 'занижает', 'count': 8, 'severity': 0.15}
            },
            'artistic': {
                'weak': {...},
                'medium': {...},
                'strong': {...}
            }
        }
        """
        with Session(self.engine) as session:
            stmt = select(Assessment, Performance).join(
                Performance, Assessment.performance_id == Performance.id
            ).where(
                Assessment.referee_id == referee_id
            )
            
            results = session.exec(stmt).all()
            
            # Инициализируем структуру для двух типов оценок
            profile = {
                'execution': {
                    'weak': {'deviations': [], 'count': 0},
                    'medium': {'deviations': [], 'count': 0},
                    'strong': {'deviations': [], 'count': 0}
                },
                'artistic': {
                    'weak': {'deviations': [], 'count': 0},
                    'medium': {'deviations': [], 'count': 0},
                    'strong': {'deviations': [], 'count': 0}
                }
            }
            
            for assessment, performance in results:
                final_score = assessment.result_type_assessment
                deviation = assessment.referee_assessment - final_score
                
                # Определяем уровень спортсмена
                if final_score < 7.0:
                    level = 'weak'
                elif final_score < 8.5:
                    level = 'medium'
                else:
                    level = 'strong'
                
                # Определяем тип оценки
                if assessment.type == 'EXECUTION':
                    target = profile['execution'][level]
                elif assessment.type == 'ARTISTIC':
                    target = profile['artistic'][level]
                else:
                    continue
                
                target['deviations'].append(deviation)
                target['count'] += 1
            
            # Рассчитываем среднее отклонение и вердикт для каждого уровня и типа
            result = {}
            for assessment_type in ['execution', 'artistic']:
                result[assessment_type] = {}
                
                for level_name, data in profile[assessment_type].items():
                    if data['count'] > 0:
                        avg_deviation = sum(data['deviations']) / data['count']
                        
                        # Определяем вердикт на основе среднего отклонения
                        if avg_deviation > 0.1:
                            verdict = 'завышает'
                        elif avg_deviation < -0.1:
                            verdict = 'занижает'
                        else:
                            verdict = 'объективен'
                        
                        result[assessment_type][level_name] = {
                            'avg_deviation': round(avg_deviation, 3),
                            'verdict': verdict,
                            'count': data['count'],
                            'severity': abs(round(avg_deviation, 3))
                        }
                    else:
                        result[assessment_type][level_name] = {
                            'avg_deviation': 0,
                            'verdict': 'нет данных',
                            'count': 0,
                            'severity': 0
                        }
            
            return result
