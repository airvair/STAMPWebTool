# Chapter 5: Appendices

This chapter contains supplementary materials to support the design document, including a glossary of terms and a requirements traceability matrix.

---

## A. Glossary of Terms

This glossary defines key terms used throughout the project, categorized for clarity.

### STAMP (Systems-Theoretic Accident Model and Processes) Terminology

- **Accident/Loss Event:** An undesirable and unplanned event that results in a loss, such as loss of human life or injury, property damage, mission failure, or environmental pollution.
- **Control Structure:** A hierarchical model representing the safety and operational control relationships within a system. It consists of controllers, controlled processes, control actions, and feedback loops.
- **Controller:** A system component (e.g., human operator, software algorithm, mechanical device) that issues control actions to manage a process.
- **Controlled Process:** The system or component being managed by a controller.
- **Control Action:** An instruction or intervention from a controller to a controlled process intended to influence its behavior.
- **Feedback:** Information from the controlled process and the environment sent back to the controller, providing insight into the state of the process.
- **Process Model:** The internal model or understanding a controller has of the controlled process it manages. Flaws in this model can lead to unsafe control.
- **Safety Constraints:** The set of rules, conditions, or boundaries on system behavior required to prevent accidents. The primary goal of the safety control structure is to enforce these constraints.
- **System:** A set of interacting or interdependent components forming an integrated whole to achieve a common purpose.

### CAST (Causal Analysis based on STAMP) Specific Terms

- **Causal Analysis:** The post-accident investigation process of determining the systemic root causes of a loss event. CAST is the STAMP-based methodology for this analysis.
- **Events:** The chronological sequence of occurrences that led up to and were involved in the loss event.
- **Proximate Events:** The specific, immediate events in the causal chain that directly led to the accident.
- **System-Level Causes:** The underlying systemic factors, organizational issues, and control structure flaws that created the conditions for the accident, moving beyond individual component failures or operator errors.
- **Recommendations:** Actionable proposals for changes to the system's design, processes, or control structure to prevent the recurrence of similar accidents.

### STPA (Systems-Theoretic Process Analysis) Specific Terms

- **Hazard:** A system state or set of conditions that, together with a particular set of worst-case environmental conditions, will lead to an accident.
- **Unsafe Control Action (UCA):** A control action that, in a particular context and worst-case environment, will lead to a hazard. There are four fundamental types:
  1.  A required control action is not provided.
  2.  An unsafe control action is provided that leads to a hazard.
  3.  A potentially safe control action is provided too early, too late, or in the wrong sequence.
  4.  A required control action is stopped too soon or applied for too long.
- **Controller Constraints:** The safety rules, derived directly from the identified UCAs, that a controller must enforce to ensure safe operation. Also known as safety requirements.
- **Causal Scenarios:** Scenarios explaining how a UCA could occur. These scenarios focus on control flaws, process model inaccuracies, and inadequate feedback rather than just component failure events.

### Technical Terms

- **API (Application Programming Interface):** A contract that defines how different software components communicate. In this project, it primarily refers to the interface between the frontend client and any backend services.
- **Component:** A modular, reusable, and independent piece of the user interface, such as a button, form, or dialog. The tool is built using a component-based architecture via React.
- **JSON (JavaScript Object Notation):** A lightweight, text-based data-interchange format used for transmitting data between the client and server.
- **React:** A declarative, component-based JavaScript library for building user interfaces for single-page applications.
- **State Management:** The practice of managing the data that an application needs to function, including user inputs, server responses, and UI state.
- **TypeScript:** A statically typed superset of JavaScript that adds type safety to the codebase, reducing errors and improving developer experience.
- **Vite:** A modern frontend build tool that provides a significantly faster and leaner development experience for web projects compared to traditional bundlers.

### UI/UX (User Interface / User Experience) Terms

- **Accessibility (a11y):** The inclusive practice of designing and developing digital products that are usable by people with a wide range of abilities and disabilities.
- **Component Library:** A centralized collection of pre-built, styled, and reusable UI components that ensures design consistency and development efficiency.
- **Mockup:** A static, high-fidelity visual representation of the user interface, demonstrating the look and feel (colors, typography, layout) of the final product.
- **Prototype:** An interactive, high-fidelity simulation of the final user interface that allows for user testing and workflow validation before development.
- **Responsive Design:** The design approach that ensures the application's layout and content adapt gracefully to a variety of screen sizes and devices (desktop, tablet, mobile).
- **Usability:** The degree to which a product can be used by specified consumers to achieve quantified objectives with effectiveness, efficiency, and satisfaction in a quantified context of use.
- **Wireframe:** A low-fidelity, skeletal outline of the user interface that focuses on structure, content hierarchy, and functionality, ignoring visual design details.

---

## B. Requirements Traceability Matrix (RTM)

The Requirements Traceability Matrix (RTM) is a living document used to ensure that all defined requirements are systematically addressed, implemented, and verified throughout the project lifecycle. It provides a clear mapping from each requirement to its corresponding design elements, code modules, and test cases.

### Functional Requirements Traceability

| Req. ID | Requirement Description                                                   | Design Doc Section(s) | Associated Code Module(s)      | Test Case ID(s)            | Implementation Status | Verification Method         | Notes                            |
| :------ | :------------------------------------------------------------------------ | :-------------------- | :----------------------------- | :------------------------- | :-------------------- | :-------------------------- | :------------------------------- |
| FR-001  | _User shall be able to create, name, and save a new analysis project._    | 3.1, 4.3              | `src/features/projects/`       | `TC-PROJ-01`, `TC-PROJ-02` | `Not Started`         | Unit Test, Integration Test |                                  |
| FR-002  | _System shall allow users to define system-level losses and hazards._     | 3.1, 4.1              | `src/features/STAMP/step1_...` | `TC-HAZ-01`, `TC-HAZ-02`   | `In Progress`         | E2E Test, Manual Test       |                                  |
| FR-003  | _System shall guide users to identify Unsafe Control Actions (UCAs)._     | 3.1, 4.3              | `src/features/STAMP/step3_...` | `TC-UCA-01`                | `Completed`           | Manual Test                 | Initial implementation complete. |
| FR-004  | _System shall provide a graphical editor to model the control structure._ | 2.2, 4.3              | `src/features/STAMP/step2_...` | `TC-CS-01` to `TC-CS-05`   | `Not Started`         | Integration Test, E2E Test  | Requires a graph library.        |
| FR-005  | _Users shall be able to export the final analysis report as a PDF._       | 3.1                   | `src/utils/reportGenerator.ts` | `TC-RPT-01`                | `Not Started`         | E2E Test                    |                                  |
| ...     | ...                                                                       | ...                   | ...                            | ...                        | ...                   | ...                         |                                  |

### Non-Functional Requirements Traceability

| Req. ID | Requirement Description                                                               | Design Doc Section(s) | Associated Code Module(s)     | Test Case ID(s) | Implementation Status | Verification Method          | Notes                            |
| :------ | :------------------------------------------------------------------------------------ | :-------------------- | :---------------------------- | :-------------- | :-------------------- | :--------------------------- | :------------------------------- |
| NFR-001 | _The web interface shall achieve a Lighthouse performance score of 90+._              | 3.2                   | `vite.config.ts`, `App.tsx`   | `TC-PERF-01`    | `In Progress`         | Performance Test             | Monitored on each build.         |
| NFR-002 | _The application must be fully responsive and usable on Chrome, Firefox, and Safari._ | 2.3, 3.2              | `src/styles/main.css`         | `TC-COMPAT-01`  | `In Progress`         | Manual Test                  | Regular cross-browser checks.    |
| NFR-003 | _All user-generated analysis data must be saved automatically to local storage._      | 3.2, 4.2              | `src/utils/storageManager.ts` | `TC-SAVE-01`    | `Completed`           | Integration Test             |                                  |
| NFR-004 | _The UI must comply with WCAG 2.1 Level AA accessibility standards._                  | 2.3, 3.2              | `src/components/ui/`          | `TC-A11Y-01`    | `In Progress`         | Automated Scan (Axe), Manual | Focus on semantic HTML and ARIA. |
| NFR-005 | _Application state changes must be consistently managed to prevent data loss._        | 4.2                   | `src/context/`, `src/hooks/`  | `TC-STATE-01`   | `Completed`           | Unit Test, Integration Test  |                                  |
| ...     | ...                                                                                   | ...                   | ...                           | ...             | ...                   | ...                          |                                  |
