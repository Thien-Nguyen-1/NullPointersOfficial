import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import VisualFillTheFormEditor from '../../components/editors/VisualFillTheFormEditor';

describe('VisualFillTheFormEditor', () => {
    let mockProps;
    let componentRef;
    
    beforeEach(() => {
        mockProps = {
            moduleId: 'test-module-123',
            quizType: 'text_input',
            initialQuestions: [
                { id: 1, question_text: 'My Mood is (____) today.', order: 0 },
                { id: 2, question_text: 'I am (____).', order: 1 }
            ],
            setQuestion: vi.fn()
        };
        componentRef = React.createRef();
    });

    test('renders with initial questions', () => {
        render(<VisualFillTheFormEditor ref={componentRef} {...mockProps} />);
    
        const moodQuestionTextPart1 = screen.getByText(/My Mood is/);
        const moodQuestionTextPart2 = screen.getByText(/today\./);
    
        expect(moodQuestionTextPart1).toBeInTheDocument();
        expect(moodQuestionTextPart2).toBeInTheDocument();
    
        console.log(moodQuestionTextPart1.closest('.fitb-question-box').innerHTML);
        console.log(moodQuestionTextPart2.closest('.fitb-question-box').innerHTML);
    
        const inputBetween = moodQuestionTextPart1.closest('.fitb-question-box').querySelector('input.fitb-input-field');
        expect(inputBetween).toBeInTheDocument();
    });

    
    
});
