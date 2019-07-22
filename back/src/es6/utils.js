'use strict'


class Utils{
    getDate = (dateStr) => {
        const regex = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/;
        const dateArray = regex.exec(dateStr);
        return new Date(
            parseInt(dateArray[1]),
            parseInt(dateArray[2]) - 1, // Careful, month starts at 0!
            parseInt(dateArray[3]),
            parseInt(dateArray[4]),
            parseInt(dateArray[5]),
            parseInt(dateArray[6])
        ).getTime();
    }

}

export default new Utils();