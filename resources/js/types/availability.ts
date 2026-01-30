export interface AvailabilityOption {
    id: string;
    label: string;
    color: 'teal' | 'gray';
}

export interface AvailabilitySelections {
    [date: string]: string | null;
}

export interface AvailabilityRequirements {
    weekday: {
        total_blocks: number, // weekday blocks completed
        is_met: boolean  // is the weekday requirement met
    };
    weekend: {
        total_blocks: number,  // weekend blocks completed
        is_met: boolean  // is the weekend requirement met
    };
    overall_status: boolean; // are all availability requirements met
}

export interface User {
    id: number;
    name: string;
    email: string;
}