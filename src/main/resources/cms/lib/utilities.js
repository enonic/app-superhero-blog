var module = 'com.enonic.theme.superhero';

exports.getMonthName = function(date) {

    var month = date.getMonth();
    var monthName;

    switch (month) {
        case 0 : monthName = 'January';
        break;
        case 1 : monthName = 'February';
        break;
        case 2 : monthName = 'March';
        break;
        case 3 : monthName = 'April';
        break;
        case 4 : monthName = 'May';
        break;
        case 5 : monthName = 'June';
        break;
        case 6 : monthName = 'July';
        break;
        case 7 : monthName = 'August';
        break;
        case 8 : monthName = 'September';
        break;
        case 9 : monthName = 'October';
        break;
        case 10 : monthName = 'November';
        break;
        case 11 : monthName = 'December';
        break;
    }

    return monthName;
};

exports.getFormattedDate = function(date) {
    var currentDate = new Date();
    var dateString = exports.getMonthName(date);
    dateString += ' ' + date.getDate();

    if (currentDate.getFullYear() != date.getFullYear()) {
        dateString += ', ' + date.getFullYear();
    }
    return dateString;
};