export interface AvailabilityOption {
    id: string;
    label: string;
    color: 'teal' | 'gray';
}

export interface AvailabilitySelections {
    [date: string]: string | null;
}

export interface AvailabilityRequirements {
    weekday_blocks: number;
    weekend_blocks: number;
    weekday_requirement_met: boolean;
    weekend_requirement_met: boolean;
    all_requirements_met: boolean;
}

export interface User {
    id: number;
    name: string;
    email: string;
}