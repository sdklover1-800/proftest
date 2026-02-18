import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { IonButton, IonContent, IonPage } from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';

import { assessmentApi } from '@/api/assessmentApi';
import AILoadingOverlay from '@/shared/ui/AILoadingOverlay';
import type { PlanDay, PlanTask, PlanTaskStatus, WeeklyPlan } from '@/types/assessment';

type PlanRouteParams = {
    planId?: string;
};

const computeProgressFromDays = (plan: WeeklyPlan): WeeklyPlan => {
    const clonedDays: PlanDay[] = plan.days.map((day) => {
        const doneCount = day.tasks.filter((task) => task.status === 'done').length;
        const totalCount = day.tasks.length;
        const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
        return {
            ...day,
            done_count: doneCount,
            total_count: totalCount,
            progress_percent: progressPercent,
        };
    });

    const doneCount = clonedDays.reduce((acc, day) => acc + (day.done_count ?? 0), 0);
    const totalCount = clonedDays.reduce((acc, day) => acc + (day.total_count ?? 0), 0);
    const inProgressCount = clonedDays.reduce(
        (acc, day) => acc + day.tasks.filter((task) => task.status === 'in_progress').length,
        0,
    );
    const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
    const completedMinutes = clonedDays.reduce((acc, day) => {
        return (
            acc +
            day.tasks
                .filter((task) => task.status === 'done')
                .reduce((taskAcc, task) => taskAcc + task.estimated_minutes, 0)
        );
    }, 0);

    const todayDay = clonedDays.find(
        (day) => (day.total_count ?? 0) > 0 && (day.done_count ?? 0) < (day.total_count ?? 0),
    );

    return {
        ...plan,
        days: clonedDays,
        progress: {
            done_count: doneCount,
            total_count: totalCount,
            in_progress_count: inProgressCount,
            progress_percent: progressPercent,
            completed_minutes: completedMinutes,
            estimated_total_minutes: plan.estimated_total_minutes,
            day_progress: clonedDays.map((day) => ({
                day_index: day.day_index,
                title: day.title,
                done_tasks: day.done_count ?? 0,
                total_tasks: day.total_count ?? 0,
                percent: day.progress_percent ?? 0,
            })),
        },
        today_day_index: progressPercent >= 100 ? null : todayDay?.day_index ?? null,
        is_completed: progressPercent >= 100,
    };
};

const updateTaskStatusOptimistically = (
    plan: WeeklyPlan,
    taskId: string,
    nextStatus: PlanTaskStatus,
): WeeklyPlan => {
    const now = new Date().toISOString();
    const nextDays = plan.days.map((day) => ({
        ...day,
        tasks: day.tasks.map((task) => {
            if (task.task_id !== taskId) {
                return task;
            }
            return {
                ...task,
                status: nextStatus,
                done_at: nextStatus === 'done' ? (task.done_at ?? now) : null,
            };
        }),
    }));

    return computeProgressFromDays({ ...plan, days: nextDays });
};

const PlanPage: React.FC = () => {
    const { planId } = useParams<PlanRouteParams>();
    const history = useHistory();

    const [plan, setPlan] = useState<WeeklyPlan | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({});
    const [updatingTasks, setUpdatingTasks] = useState<Record<string, boolean>>({});

    const loadPlan = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const payload = planId
                ? await assessmentApi.getPlan(planId)
                : await assessmentApi.getActivePlan();
            setPlan(payload);
            const dayToOpen = payload.today_day_index ?? payload.days[0]?.day_index ?? 1;
            setExpandedDays({ [dayToOpen]: true });
        } catch (err) {
            setPlan(null);
            setError('Could not load active plan.');
            console.error('Failed to load plan', err);
        } finally {
            setLoading(false);
        }
    }, [planId]);

    useEffect(() => {
        void loadPlan();
    }, [loadPlan]);

    const todayDay = useMemo(() => {
        if (!plan) return null;
        if (plan.today_day_index == null) return null;
        return plan.days.find((day) => day.day_index === plan.today_day_index) ?? null;
    }, [plan]);

    const onToggleTask = async (task: PlanTask): Promise<void> => {
        if (!plan) return;
        if (updatingTasks[task.task_id]) return;

        const nextStatus: PlanTaskStatus = task.status === 'done' ? 'todo' : 'done';
        const previousPlan = plan;

        setUpdatingTasks((prev) => ({ ...prev, [task.task_id]: true }));
        setPlan(updateTaskStatusOptimistically(plan, task.task_id, nextStatus));

        try {
            await assessmentApi.updatePlanTaskStatus(plan.plan_id, {
                task_id: task.task_id,
                status: nextStatus,
            });
            const refreshed = await assessmentApi.getPlan(plan.plan_id);
            setPlan(refreshed);
        } catch (err) {
            setPlan(previousPlan);
            setError('Could not update task status.');
            console.error('Failed to update task', err);
        } finally {
            setUpdatingTasks((prev) => ({ ...prev, [task.task_id]: false }));
        }
    };

    const moveToNextDay = (): void => {
        if (!plan || plan.today_day_index == null) return;
        const currentDayIndex = plan.today_day_index;
        const nextDay = plan.days.find((day) => day.day_index === currentDayIndex + 1);
        if (!nextDay) return;
        setExpandedDays({ [nextDay.day_index]: true });
    };

    return (
        <IonPage className="bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
            <AILoadingOverlay
                isOpen={loading}
                title="AI is preparing your plan"
                message="Loading your weekly roadmap and progress..."
            />
            <IonContent className="ion-padding bg-gray-50 dark:bg-gray-900">
                <div className="p-6 space-y-5">
                    {loading && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                            <span className="text-sm text-gray-500 dark:text-gray-300">Loading plan...</span>
                        </div>
                    )}

                    {error && !loading && (
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-700">
                            {error}
                        </div>
                    )}

                    {!loading && !plan && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">No active plan</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Start an assessment to generate a new 7-day plan.
                            </p>
                            <IonButton expand="block" onClick={() => history.push('/assessment/context')}>
                                Run assessment
                            </IonButton>
                        </div>
                    )}

                    {!loading && plan && (
                        <div className="space-y-5">
                            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="text-xs uppercase tracking-widest text-indigo-500 font-semibold">7-day plan</div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">{plan.title}</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{plan.goal}</p>
                                <div className="mt-4">
                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                        <span>Progress</span>
                                        <span>
                                            {plan.progress.done_count}/{plan.progress.total_count}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 rounded-full"
                                            style={{ width: `${plan.progress.progress_percent}%` }}
                                        />
                                    </div>
                                    <div className="text-xs text-gray-500 mt-2">
                                        {plan.progress.progress_percent}% complete
                                    </div>
                                </div>
                            </div>

                            {plan.is_completed ? (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                                    <h3 className="text-lg font-bold text-emerald-800">Plan completed</h3>
                                    <p className="text-sm text-emerald-700 mt-2">
                                        Re-run assessment to refresh deltas and generate the next plan.
                                    </p>
                                    <IonButton expand="block" className="mt-4" onClick={() => history.push('/assessment/context')}>
                                        Re-run assessment
                                    </IonButton>
                                </div>
                            ) : (
                                <>
                                    {todayDay && (
                                        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                Today (Day {todayDay.day_index})
                                            </h3>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {todayDay.done_count ?? 0}/{todayDay.total_count ?? todayDay.tasks.length} tasks done
                                            </div>
                                            <div className="mt-3 space-y-2">
                                                {todayDay.tasks.map((task) => (
                                                    <button
                                                        key={task.task_id}
                                                        className="w-full text-left border border-gray-100 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-700 disabled:opacity-60"
                                                        disabled={!!updatingTasks[task.task_id]}
                                                        onClick={() => void onToggleTask(task)}
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                                                {task.title}
                                                            </div>
                                                            <div className={`text-xs font-semibold ${task.status === 'done' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                                {task.status === 'done' ? 'Done' : 'Todo'}
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {task.type} | {task.estimated_minutes} min
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Week timeline</h3>
                                        {plan.days.map((day) => {
                                            const isExpanded = !!expandedDays[day.day_index];
                                            return (
                                                <div key={day.day_index} className="border border-gray-100 dark:border-gray-700 rounded-xl">
                                                    <button
                                                        className="w-full p-3 flex items-center justify-between"
                                                        onClick={() =>
                                                            setExpandedDays((prev) => ({
                                                                ...prev,
                                                                [day.day_index]: !prev[day.day_index],
                                                            }))
                                                        }
                                                    >
                                                        <div className="text-left">
                                                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                                Day {day.day_index}: {day.title}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {day.done_count ?? 0}/{day.total_count ?? day.tasks.length} tasks | {day.progress_percent ?? 0}%
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-indigo-600 font-semibold">
                                                            {isExpanded ? 'Hide' : 'Show'}
                                                        </div>
                                                    </button>
                                                    {isExpanded && (
                                                        <div className="px-3 pb-3 space-y-2">
                                                            {day.tasks.map((task) => (
                                                                <button
                                                                    key={task.task_id}
                                                                    className="w-full text-left bg-gray-50 dark:bg-gray-700 rounded-lg p-3 disabled:opacity-60"
                                                                    disabled={!!updatingTasks[task.task_id]}
                                                                    onClick={() => void onToggleTask(task)}
                                                                >
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                                                                            {task.title}
                                                                        </div>
                                                                        <div className={`text-xs font-semibold ${task.status === 'done' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                                            {task.status === 'done' ? 'Done' : 'Todo'}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 mt-1">
                                                                        {task.type} | {task.estimated_minutes} min
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}

                            {!plan.is_completed && todayDay && (todayDay.done_count ?? 0) === (todayDay.total_count ?? 0) && (
                                <IonButton expand="block" onClick={moveToNextDay}>
                                    Move to next day
                                </IonButton>
                            )}
                        </div>
                    )}
                </div>
            </IonContent>
        </IonPage>
    );
};

export default PlanPage;
