export const loadGuest = (roomId: string) => {
    const data = localStorage.getItem(`guest_${roomId.toUpperCase()}`);
    return data ? JSON.parse(data) : null;
};
