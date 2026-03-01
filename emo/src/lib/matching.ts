/**
 * This module simulates the algorithm described in the core requirement:
 * - Match by emotional state + needs + stability
 * - Never put all "high distress" people together
 * - Include 1-2 lower-intensity (stable) members
 * - Max 1 "overwhelmed + needs to talk a lot"
 * - Balance listener/sharers
 */

export interface UserVector {
    topic: string;
    intensity: number;
    energy: number;
    needs: string[];
    readiness: "listen" | "share_little" | "talk_lot";
}

export interface RoomState {
    id: string;
    topic: string;
    members: UserVector[];
}

// In a real app, this would query a database of waiting users.
export function simulateMatch(currentUser: UserVector): RoomState {
    // We mock a room that is compatible with this user, ensuring safety rules.

    const mockMembers: UserVector[] = [];

    // Rule 1 & 2: We need 1-2 stable members (intensity < 50)
    if (currentUser.intensity >= 50) {
        mockMembers.push(createMockUser({ intensity: 30, readiness: "listen" }));
        mockMembers.push(createMockUser({ intensity: 40, readiness: "share_little" }));
    } else {
        // If current is stable, we can add a higher distress one
        mockMembers.push(createMockUser({ intensity: 80, readiness: "share_little" }));
        mockMembers.push(createMockUser({ intensity: 60, readiness: "talk_lot" }));
    }

    // Rule 3: No more than 1 "overwhelmed + talk a lot"
    const hasOverwhelmedTalker = [currentUser, ...mockMembers].some(
        m => m.intensity > 80 && m.readiness === "talk_lot"
    );

    if (!hasOverwhelmedTalker) {
        mockMembers.push(createMockUser({ intensity: 75, readiness: "listen" }));
    } else {
        mockMembers.push(createMockUser({ intensity: 45, readiness: "share_little" })); // Add a balancer
    }

    return {
        id: Math.random().toString(36).substring(7),
        topic: currentUser.topic,
        members: [currentUser, ...mockMembers]
    };
}

function createMockUser(overrides: Partial<UserVector>): UserVector {
    const needsPool = ["listening", "understood", "sharing", "coping", "perspective"];
    return {
        topic: "mocked", // Usually bounded to the room
        intensity: Math.floor(Math.random() * 100),
        energy: Math.floor(Math.random() * 100),
        needs: [needsPool[Math.floor(Math.random() * needsPool.length)]],
        readiness: "share_little",
        ...overrides
    };
}
