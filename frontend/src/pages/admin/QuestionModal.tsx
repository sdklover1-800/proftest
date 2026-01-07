/**
 * Question creation/editing modal component.
 */

import React from 'react';
import { IonModal, IonButton, IonInput, IonSelect, IonSelectOption } from '@ionic/react';

import type { NewQuestion } from './types';

interface QuestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
    question: NewQuestion;
    onFieldChange: (field: keyof NewQuestion, value: string) => void;
    isEditing?: boolean;
}

export const QuestionModal: React.FC<QuestionModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    question,
    onFieldChange,
    isEditing = false,
}) => (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
        <div className="p-6 bg-white min-h-full">
            <h2 className="text-xl font-bold mb-6">
                {isEditing ? 'Редактировать вопрос' : 'Новый вопрос'}
            </h2>

            <div className="space-y-4">
                <IonInput
                    label="Код вопроса"
                    labelPlacement="stacked"
                    value={question.code}
                    onIonInput={(e) => onFieldChange('code', e.detail.value || '')}
                    placeholder="R_01"
                />

                <IonInput
                    label="Текст (RU)"
                    labelPlacement="stacked"
                    value={question.text_ru}
                    onIonInput={(e) => onFieldChange('text_ru', e.detail.value || '')}
                    placeholder="Мне нравится работать руками"
                />

                <IonInput
                    label="Текст (KZ)"
                    labelPlacement="stacked"
                    value={question.text_kz}
                    onIonInput={(e) => onFieldChange('text_kz', e.detail.value || '')}
                />

                <IonInput
                    label="Текст (EN)"
                    labelPlacement="stacked"
                    value={question.text_en}
                    onIonInput={(e) => onFieldChange('text_en', e.detail.value || '')}
                />

                <IonSelect
                    label="Модуль"
                    labelPlacement="stacked"
                    value={question.module}
                    onIonChange={(e) => onFieldChange('module', e.detail.value)}
                >
                    <IonSelectOption value="RIASEC">RIASEC</IonSelectOption>
                    <IonSelectOption value="Big5">Big Five</IonSelectOption>
                    <IonSelectOption value="SJT">SJT</IonSelectOption>
                </IonSelect>

                <IonSelect
                    label="Тип"
                    labelPlacement="stacked"
                    value={question.type}
                    onIonChange={(e) => onFieldChange('type', e.detail.value)}
                >
                    <IonSelectOption value="likert">Likert</IonSelectOption>
                    <IonSelectOption value="choice">Choice</IonSelectOption>
                </IonSelect>

                <IonSelect
                    label="Категория"
                    labelPlacement="stacked"
                    value={question.category}
                    onIonChange={(e) => onFieldChange('category', e.detail.value)}
                    placeholder="R, I, A, S, E, C"
                >
                    <IonSelectOption value="R">Realistic (R)</IonSelectOption>
                    <IonSelectOption value="I">Investigative (I)</IonSelectOption>
                    <IonSelectOption value="A">Artistic (A)</IonSelectOption>
                    <IonSelectOption value="S">Social (S)</IonSelectOption>
                    <IonSelectOption value="E">Enterprising (E)</IonSelectOption>
                    <IonSelectOption value="C">Conventional (C)</IonSelectOption>
                </IonSelect>
            </div>

            <div className="flex gap-4 mt-8">
                <IonButton expand="block" onClick={onSubmit} className="flex-1">
                    {isEditing ? 'Сохранить' : 'Создать'}
                </IonButton>
                <IonButton expand="block" fill="outline" onClick={onClose} className="flex-1">
                    Отмена
                </IonButton>
            </div>
        </div>
    </IonModal>
);
