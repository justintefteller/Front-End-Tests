class General {
    dates = () => {
        var today;
        var future_date;
        var tomorrow;
        var moment = require("moment");
        var day = moment().format('dddd');
        var future_day = moment().add(1, "years").format('dddd');
        if(day == 'Saturday'){
            today = moment().subtract(1, "days").format("YYYY-MM-DD");
        }else if(day == 'Sunday'){
            today = moment().subtract(2, "days").format("YYYY-MM-DD");
        }else {
            today = moment().format("YYYY-MM-DD");
        }

        if(future_day == 'Saturday'){
            future_date = moment().add(1, "years").subtract(1, "days").format("YYYY-MM-DD");
        }else if(future_day == 'Sunday'){
            future_date = moment().add(1, "years").subtract(2, "days").format("YYYY-MM-DD");
        }else {
            future_date = moment().add(1, "years").format("YYYY-MM-DD");
        }

        if(day == 'Saturday'){
            tomorrow = moment().format("YYYY-MM-DD");
        }else if(day == 'Sunday'){
            tomorrow = moment().subtract(1, "days").format("YYYY-MM-DD");
        }else {
            tomorrow = moment().add(1, 'days').format("YYYY-MM-DD");
        } 

        return [today, future_date, tomorrow]
    }

    info = (length_of_info) => {
        var length = length_of_info;
        var result = "";
        var characters =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    formatMoney = (value, symbol, decPlaces, thouSeparator, decSeparator) => {
        var n = value,
        decPlaces = isNaN(decPlaces = Math.abs(decPlaces)) ? 2 : decPlaces,
        decSeparator = decSeparator == undefined ? "." : decSeparator,
        thouSeparator = thouSeparator == undefined ? "," : thouSeparator,
        sign = n < 0 ? "-" : "",
        i = parseInt(n = Math.abs(+n || 0).toFixed(decPlaces)) + "",
        j = (j = i.length) > 3 ? j % 3 : 0;
        return symbol + sign + (j ? i.substr(0, j) + thouSeparator : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thouSeparator) + (decPlaces ? decSeparator + Math.abs(n - i).toFixed(decPlaces).slice(2) : "");
    };
}

export default General;

