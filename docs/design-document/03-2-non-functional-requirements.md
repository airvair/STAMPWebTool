# 3.2 Non-Functional RequirI have created the "Non-Functional Requirements" chapter of the design document as requested. You can find it at `docs/design-document/03-2-non-functional-requirements.md`.
 of the system, ensuring it is usable, performant, reliable, and maintainable for an enterprise environment.

---

### 3.2.1. Usability

Usability is critical for ensuring that safety analysts can efficiently and effectively use the tool without extensive training or frustration.

-   **User Interface Intuitiveness:**
    -   **NFR-3.2.1.1:** A user with prior knowledge of the STPA/CAST methodology must be able to complete a basic analysis workflow (define purpose, identify losses/hazards, model control structure, identify unsafe control actions) within 30 minutes of their first use without consulting external documentation.
    -   **NFR-3.2.1.2:** Critical and frequently used functions (e.g., adding a new item, saving progress, navigating between steps) shall be discoverable and accessible from the main workspace with no more than two clicks.
    -   **NFR-3.2.1.3:** The user interface shall provide immediate visual feedback for user actions (e.g., loading indicators, save confirmations, validation errors) to keep the user informed of the system's state.

-   **Learning Curve Requirements:**
    -   **NFR-3.2.1.4:** A new user must be able to achieve proficiency in all core analysis features after a single 2-hour guided training session. Proficiency is defined as the ability to use features at 80% of the speed of an expert user.
    -   **NFR-3.2.1.5:** The system shall be designed to minimize cognitive load by maintaining consistent layouts, terminology, and interaction patterns across all modules and analysis steps.

-   **Accessibility Standards:**
    -   **NFR-3.2.1.6:** The web interface must comply with the Web Content Accessibility Guidelines (WCAG) 2.1 at the AA level. This includes providing sufficient color contrast, keyboard navigation, screen reader support (ARIA labels), and text alternatives for non-text content.

-   **Help and Documentation:**
    -   **NFR-3.2.1.7:** Context-sensitive help, in the form of tooltips or info pop-ups, must be available for every input field, data table, and analysis section, explaining its purpose and required format.
    -   **NFR-3.2.1.8:** A comprehensive, searchable online user manual and knowledge base must be accessible directly from within the application's main navigation.

### 3.2.2. Performance

The tool must be responsive and capable of handling the demands of complex, large-scale safety analyses.

-   **Response Time Requirements:**
    -   **NFR-3.2.2.1:** 95% of all client-side UI interactions (e.g., opening modals, toggling views, client-side filtering) must complete in under 200 milliseconds.
    -   **NFR-3.2.2.2:** Core server-side operations (e.g., creating, updating, or deleting a single analysis item) must have a P95 response time of less than 1 second.
    -   **NFR-3.2.2.3:** Complex queries or report generation should not exceed 10 seconds. For any operation expected to exceed 5 seconds, a progress indicator must be displayed.

-   **Load Time Targets:**
    -   **NFR-3.2.2.4:** The initial application load time for a first-time user on a 50 Mbps connection must be under 3 seconds.
    -   **NFR-3.2.2.5:** Subsequent application loads with a primed cache must be under 1.5 seconds.

-   **Concurrent User Support:**
    -   **NFR-3.2.2.6:** The system must support a minimum of 50 concurrent users actively creating, viewing, and modifying analyses without performance degradation below the specified response time thresholds.

-   **Data Volume Handling:**
    -   **NFR-3.2.2.7:** The application must maintain specified performance levels when handling a single, large-scale analysis containing up to:
        -   100 Hazards/Losses
        -   500 Control Actions
        -   2,000 Unsafe Control Actions (UCAs)
        -   5,000 Causal Scenarios

### 3.2.3. Data Integrity & Persistence

The system must ensure that user data is accurate, safe, and reliably stored.

-   **Data Validation Rules:**
    -   **NFR-3.2.3.1:** All user inputs must be validated on both the client-side (for immediate feedback) and server-side (for security and integrity) to prevent data corruption and security vulnerabilities like XSS.
    -   **NFR-3.2.3.2:** The system must enforce referential integrity at the database level. For example, a UCA cannot be associated with a non-existent control action.

-   **Backup and Recovery:**
    -   **NFR-3.2.3.3:** The production database must be backed up automatically on a daily basis.
    -   **NFR-3.2.3.4:** The system must have a documented disaster recovery plan with a Recovery Point Objective (RPO) of 24 hours and a Recovery Time Objective (RTO) of 4 hours.

-   **Data Consistency:**
    -   **NFR-3.2.3.5:** The system shall use atomic transactions for all database write operations that involve multiple related entities to ensure the data remains in a consistent state, even in the event of a partial failure.

-   **Version Control:**
    -   **NFR-3.2.3.6:** The system must automatically save a snapshot of an analysis project upon major milestones (e.g., completing a step).
    -   **NFR-3.2.3.7:** Users must be able to view a history of these snapshots, see high-level summaries of changes between versions, and have the ability to restore a previous version.

### 3.2.4. Maintainability

The tool must be developed in a way that facilitates easy updates, bug fixes, and future enhancements.

-   **Code Organization Standards:**
    -   **NFR-3.2.4.1:** All code must adhere to the established project structure and coding standards, enforced by ESLint and Prettier configurations.
    -   **NFR-3.2.4.2:** Code complexity will be monitored. No single function or method shall exceed a cyclomatic complexity of 10.

-   **Documentation Requirements:**
    -   **NFR-3.2.4.3:** All public APIs, components, and complex business logic must be documented using TSDoc.
    -   **NFR-3.2.4.4:** A `README.md` file in each major directory must explain the purpose of the code within that module.

-   **Testing Coverage:**
    -   **NFR-3.2.4.5:** New source code for business logic and critical UI components must achieve a minimum of 80% unit and integration test coverage.
    -   **NFR-3.2.4.6:** Every bug fix must be accompanied by a new regression test that fails before the fix and passes after.

-   **Upgrade Paths:**
    -   **NFR-3.2.4.7:** The system must be architected to allow for rolling updates for minor patches and bug fixes with zero downtime.
    -   **NFR-3.2.4.8:** A documented and tested procedure must be in place for handling major version upgrades, including any necessary data schema migrations.