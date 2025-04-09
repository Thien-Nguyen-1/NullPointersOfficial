import React from 'react';
import { render, screen } from '@testing-library/react';
import Headings from '../../components/editors/Headings';
import styles from "../../styles/AddModule.module.css";

describe('Headings component', () => {
    it('renders an input with the correct placeholder', () => {
        render(<Headings headingSize="large" />);
        const inputElement = screen.getByPlaceholderText("Enter Heading here...");
        expect(inputElement).toBeInTheDocument();
    });

    it('applies CSS classes based on headingSize prop', () => {
        const { rerender } = render(<Headings headingSize="large" />);
        let inputElement = screen.getByPlaceholderText("Enter Heading here...");
        expect(inputElement.className).toContain(styles["heading-input"]);
        expect(inputElement.className).toContain(styles["large"]);

        rerender(<Headings headingSize="small" />);
        inputElement = screen.getByPlaceholderText("Enter Heading here...");
        expect(inputElement.className).toContain(styles["heading-input"]);
        expect(inputElement.className).toContain(styles["small"]);
    });

});
