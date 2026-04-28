from core.types import Referee, Performance, Assessment
from sqlmodel import Session, select, func, delete
from data.database import engine
from typing import Dict, List, Optional
from collections import defaultdict
from core.types import Rating, Types
import json

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
        """
        # Базовая точность
        execution_rate = referee_stats['execution']['accuracy_rate']
        artistic_rate = referee_stats['artistic']['accuracy_rate']
        base_rating = (execution_rate + artistic_rate) / 2
        
        # Штраф за предвзятость (чем ближе к 0, тем лучше)
        bias_execution = abs(referee_stats['execution']['bias'])
        bias_artistic = abs(referee_stats['artistic']['bias'])
        avg_bias = (bias_execution + bias_artistic) / 2
        
        # Штраф: максимум 0.3 (30%) за сильную предвзятость
        bias_penalty = min(avg_bias * 0.5, 0.3)  # bias=0.6 → штраф 0.3
        
        final_rating = (base_rating - bias_penalty) * 100
        
        return round(max(0, min(100, final_rating)), 1)  # Ограничиваем 0-100

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

    def get_referee_region_heatmap(self, referee_id: int, assessment_type: str = 'EXECUTION') -> Dict:
        """
        Тепловая карта "Судья x Регионы" (раздел 5.3)
        """
        with Session(self.engine) as session:
            stmt = select(Assessment, Performance).join(
                Performance, Assessment.performance_id == Performance.id
            ).where(
                Assessment.referee_id == referee_id,
                Assessment.type == assessment_type
            )
            

            results = session.exec(stmt).all()
            
            region_stats = defaultdict(lambda: {'sum': 0.0, 'count': 0})
            
            for assessment, performance in results:
                region = performance.region
                deviation = assessment.referee_assessment - assessment.result_type_assessment
                region_stats[region]['sum'] += deviation
                region_stats[region]['count'] += 1
            
            # Расчет среднего отклонения по регионам
            heatmap_data = {}
            for region, stats in region_stats.items():
                heatmap_data[region] = stats['sum'] / stats['count'] if stats['count'] > 0 else 0
            
            return heatmap_data

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