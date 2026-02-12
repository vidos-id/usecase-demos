## ADDED Requirements

### Requirement: Confirmation dialog component
The system SHALL provide a confirmation dialog using shadcn/ui AlertDialog component for reset operations.

#### Scenario: Dialog displays warning
- **WHEN** the reset confirmation dialog is open
- **THEN** the dialog displays the title "Reset Demo Data?" and description "This will remove all registered users and sessions. This action cannot be undone."

#### Scenario: Dialog shows action buttons
- **WHEN** the reset confirmation dialog is open
- **THEN** the dialog displays a "Cancel" button and a "Reset All Data" button

### Requirement: Destructive styling for reset action
The system SHALL style the confirmation button with destructive visual treatment.

#### Scenario: Destructive button styling
- **WHEN** the reset confirmation dialog is displayed
- **THEN** the "Reset All Data" button uses the destructive (red) color scheme

### Requirement: Dialog state management
The system SHALL manage the open/closed state of the confirmation dialog through controlled component props.

#### Scenario: Dialog controlled state
- **WHEN** the confirmation dialog is rendered
- **THEN** the dialog accepts open, onOpenChange, and onConfirm props for state control

### Requirement: Cancel dismisses dialog
The system SHALL close the dialog without executing reset when the user clicks "Cancel".

#### Scenario: Cancel button action
- **WHEN** the user clicks "Cancel" in the confirmation dialog
- **THEN** the dialog closes and no reset operation is executed

### Requirement: Confirm triggers reset
The system SHALL execute the reset operation when the user clicks "Reset All Data".

#### Scenario: Confirm button action
- **WHEN** the user clicks "Reset All Data" in the confirmation dialog
- **THEN** the onConfirm callback is invoked to execute the reset
