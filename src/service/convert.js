export const convertCords = (cords) => {
    const finalCords = [];

    if (typeof cords == "object") {
        cords.forEach(
            (i, index) => finalCords.push({ lat: parseFloat(i[0]), lng: parseFloat(i[1]) })
        )
    }

    return finalCords;
}