'use strict'

import winston from 'winston';

import { tap } from 'rxjs/operators';

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

    isDev = () => process.env['NODE_ENV'] == 'development'

    getLogger= () => winston.createLogger({
        level: this.isDev()? 'debug' : 'info',
        transports: [new winston.transports.Console()]
    })

    needCache= () => this.isDev()

    onDevRx = (_this, _fn, ...args) => {
        if (this.isDev()) return _fn.call(_this, ...args);
        return tap( (_) => {} );
    }

}

export default new Utils();