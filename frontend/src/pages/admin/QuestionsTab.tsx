/**
 * Questions management tab component.
 */

import React from 'react';
import { IonIcon } from '@ionic/react';
import { trashOutline, refreshOutline, addOutline, pencilOutline } from 'ionicons/icons';

import type { Question } from './types';

interface QuestionsTabProps {
    questions: Question[];
    onDelete: (questionId: number, questionCode: string) => void;
    onEdit: (question: Question) => void;
    onRefresh: () => void;
    onAdd: () => void;
}

export const QuestionsTab: React.FC<QuestionsTabProps> = ({
    questions,
    onDelete,
    onEdit,
    onRefresh,
    onAdd
}) => (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">❓ Вопросы ({questions.length})</h2>
            <div className="flex gap-2">
                <button type="button" onClick={onRefresh} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    <IonIcon icon={refreshOutline} className="w-5 h-5" />
                </button>
                <button
                    type="button"
                    onClick={onAdd}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-sm transition-all"
                >
                    <IonIcon icon={addOutline} className="w-5 h-5" />
                    <span>Добавить</span>
                </button>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto" style={{ maxHeight: '70vh' }}>
                <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Код</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Текст</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Модуль</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Тип</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Действия</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {questions.map((question) => (
                            <tr key={question.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 font-medium">{question.code}</td>
                                <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate" title={question.text_ru}>
                                    {question.text_ru}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                        {question.module}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {question.type}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => onEdit(question)}
                                            className="text-gray-400 hover:text-indigo-600 p-1 transition-colors"
                                            title="Редактировать"
                                        >
                                            <IonIcon icon={pencilOutline} className="w-5 h-5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onDelete(question.id, question.code)}
                                            className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                                            title="Удалить"
                                        >
                                            <IonIcon icon={trashOutline} className="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);
