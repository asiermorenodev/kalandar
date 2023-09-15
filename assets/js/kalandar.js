class Kalandar {
    constructor(options) {
        const defaultOptions = {
            selector: '',
            date: new Date(),
            dayNames: ['Sun', 'Mon', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
            monthNames: [
                'January',
                'February',
                'March',
                'April',
                'May',
                'June',
                'July',
                'August',
                'September',
                'October',
                'November',
                'December'
            ],
            weekStart: 0, // TODO: Feature not implemented.
            highlightedDates: {},
            minYear: 0,
            maxYear: 2024,
            fitWeeks: true,
            onDayClick: (calendar, day, event) => {},
            onDayRender: (calendar, day) => {},
            onLoad: (calendar) => {},
            onClear: (calendar) => {},
            onNavigation: (calendar) => {},
            beforeRender: (calendar) => {},
            afterRender: (calendar) => {}
        };

        if (typeof options !== 'object' || Array.isArray(options) || options === null) {
            options = {};
        }

        // Merge the options.
        this.options = { ...defaultOptions, ...options };

        // Set the container.
        let container;

        if (typeof this.options.selector === 'string' && this.options.selector !== '') {
            const element = document.querySelector(this.options.selector);
            if (element !== null) {
                container = document.querySelector(this.options.selector);
                container.classList.add('kalandar');
            } else {
                console.error('Invalid selector');
                return;
            }
        } else {
            container = document.createElement('div');
            container.classList.add('kalandar');
            document.body.appendChild(container);
        }

        this.container = container;

        // Set the date.
        let date;

        switch (Object.prototype.toString.call(this.options.date)) {
            case '[object Undefined]':
                date = new Date();
                break;

            case '[object Date]':
                date = this.options.date;
                break;

            case '[object String]':
                date = new Date(this.options.date);
                if ( ! this.isValidDate(date)) {
                    date = new Date();
                    console.log(this.options.date + ' is not a valid date string format.');
                }
                break;
            default:
                date = new Date();
        }

        this.month = date.getMonth();
        this.year = date.getFullYear();
        this.today = new Date();

        // Make sure the options have the right type.

        if (typeof this.options.weekStart === 'string') {
            this.options.weekStart = parseInt(this.options.weekStart);
        } else if (typeof this.options.weekStart !== 'number') {
            this.options.weekStart = defaultOptions.weekStart;
        }

        if (typeof this.options.minYear === 'string') {
            this.options.minYear = parseInt(this.options.minYear);
        } else if (typeof this.options.minYear !== 'number') {
            this.options.minYear = defaultOptions.minYear;
        }

        if (typeof this.options.maxYear === 'string') {
            this.options.maxYear = parseInt(this.options.maxYear);
        } else if (typeof this.options.maxYear !== 'number') {
            this.options.maxYear = defaultOptions.maxYear;
        }

        if (typeof this.options.fitWeeks === 'string') {
            if (this.options.fitWeeks.toLowerCase() === 'true') {
                this.options.fitWeeks = true;
            } else {
                this.options.fitWeeks = false;
            }
        } else if (typeof this.options.fitWeeks !== 'boolean') {
            this.options.fitWeeks = defaultOptions.fitWeeks;
        }

        // Now it can be rendered.
        this.render();

        // Hook
        this.options.onLoad();
    }

    render() {

        // Hook anything.
        this.options.beforeRender(this);

        // Empty the container first.
        this.container.replaceChildren();

        // Hook
        this.options.onClear();

        // Render navigation.
        this._renderNavigation();

        // Render days of week.
        this._renderDaysOfWeek();

        // Render month.
        this._renderMonth();

        // Hook anything.
        this.options.afterRender(this);
    }

    _renderNavigation() {
        const $this = this;
        const navigation = document.createElement('div');
        navigation.classList.add('navigation');

        /* Prev button */

        const prevButton = document.createElement('button');
        prevButton.classList.add('prev');
        prevButton.textContent = '<';

        const minYear = this.options.minYear;

        if (this.month === 0 && this.year === minYear) {
            prevButton.classList.add('disabled');
        } else {
            prevButton.addEventListener('click', () => {
                this.prevMonth();
                this.options.onNavigation($this);
            });
        }

        /* Period */

        const period = document.createElement('div');
        period.classList.add('period');

        const monthSpan = document.createElement('span');
        monthSpan.classList.add('month');
        monthSpan.textContent = this.options.monthNames[this.month];

        const separatorSpan = document.createElement('span');
        separatorSpan.classList.add('separator');
        separatorSpan.textContent = ' ';

        const yearSpan = document.createElement('span');
        yearSpan.classList.add('year');
        yearSpan.textContent = this.year;

        period.appendChild(monthSpan);
        period.appendChild(separatorSpan);
        period.appendChild(yearSpan);

        /* Next button */

        const nextButton = document.createElement('button');
        nextButton.classList.add('next');
        nextButton.textContent = '>';

        const maxYear = this.options.maxYear;

        if (this.month === 11 && this.year === maxYear) {
            nextButton.classList.add('disabled');
        } else {
            nextButton.addEventListener('click', () => {
                this.nextMonth();
                this.options.onNavigation($this);
            });
        }

        // Append everything

        navigation.appendChild(prevButton);
        navigation.appendChild(period);
        navigation.appendChild(nextButton);

        this.container.appendChild(navigation);
    }

    _renderDaysOfWeek() {
        const daysContainer = document.createElement('div');
        daysContainer.classList.add('days-of-week');

        const dayNames = this.options.dayNames;

        for (let i = 0; i < dayNames.length; i++) {
            const dayName = document.createElement('span');
            dayName.classList.add('day-name');
            dayName.textContent = dayNames[i];

            daysContainer.appendChild(dayName);
        }

        this.container.appendChild(daysContainer);
    }

    _renderMonth() {
        const $this = this;

        const daysOfMonth = document.createElement('div');
        daysOfMonth.classList.add('days-of-month');

        const firstDayOfMonthDate = new Date(this.year, this.month, 1);
        const lastDayOfMonthDate = new Date(this.year, this.month + 1, 0);

        const firstDateToDisplay = new Date(firstDayOfMonthDate.getTime());
        firstDateToDisplay.setDate(firstDayOfMonthDate.getDate() - firstDayOfMonthDate.getDay());

        const lastDateToDisplay = new Date(lastDayOfMonthDate.getTime());

        if (this.options.fitWeeks) {
            const numWeeks = 6;
            const totalDays = numWeeks * 7;
            const millisecondsPerDay = 1000 * 60 * 60 * 24;
            const offsetDays = totalDays - lastDayOfMonthDate.getDate() - Math.round((firstDayOfMonthDate.getTime() - firstDateToDisplay.getTime()) / millisecondsPerDay);

            lastDateToDisplay.setDate(lastDayOfMonthDate.getDate() + offsetDays);
        } else {
            lastDateToDisplay.setDate(lastDayOfMonthDate.getDate() + (6 - lastDayOfMonthDate.getDay()));
        }

        let date = new Date(firstDateToDisplay.getTime());

        while (date.getTime() <= lastDateToDisplay.getTime()) {
            const day = document.createElement('div');
            day.classList.add('day');
            day.setAttribute('data-date', this.dateToString(date));

            const textSpan = document.createElement('span');
            textSpan.classList.add('text');
            textSpan.textContent = date.getDate();

            day.appendChild(textSpan);

            if (date.getMonth() !== this.month) {
                day.classList.add('fill');
            }

            if (this.isToday(date)) {
                day.classList.add('today');
            }

            if (this.isWeekend(date)) {
                day.classList.add('weekend');
            }

            const highlightedDateData = this.getHighlightedDateData(date);

            if (highlightedDateData) {
                if (typeof highlightedDateData['class'] !== 'undefined') {
                    const classes = highlightedDateData.class.split(' ');
                    classes.forEach(className => {
                        day.classList.add(className);
                    });
                }

                if (typeof highlightedDateData['label'] !== 'undefined') {
                    day.setAttribute('aria-label', highlightedDateData['label']);
                    if (highlightedDateData['label'] !== '') {
                        day.classList.add('has-label');
                    }
                } else {
                    day.setAttribute('aria-label', '');
                }
            }

            day.addEventListener('click', event => {
                $this.options.onDayClick($this, day, event);
            });

            // HOOK
            this.options.onDayRender($this, day);

            daysOfMonth.appendChild(day);

            date.setDate(date.getDate() + 1);
        }

        this.container.appendChild(daysOfMonth);

    }

    nextMonth() {
        const lastDayOfMonthDate = new Date(this.year, this.month + 1, 0);
        const nextDate = new Date(lastDayOfMonthDate.getTime());
        nextDate.setDate(lastDayOfMonthDate.getDate() + 1);

        this.month = nextDate.getMonth();
        this.year = nextDate.getFullYear();

        this.render();
    }

    prevMonth() {
        const firstDayOfMonthDate = new Date(this.year, this.month, 1);
        const prevDate = new Date(firstDayOfMonthDate.getTime());
        prevDate.setDate(firstDayOfMonthDate.getDate() - 1);

        if (prevDate.getFullYear() >= this.options.minYear) {
            this.month = prevDate.getMonth();
            this.year = prevDate.getFullYear();

            this.render();
        }
    }

    isToday(date) {
        const today = this.today;

        return (
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate()
        );
    }

    isWeekend(date) {
        const weekendDays = [0, 6];
        return weekendDays.includes(date.getDay());
    }

    getHighlightedDateData(date) {
        const dateString = this.dateToString(date);

        if (typeof this.options.highlightedDates[dateString] === 'undefined') {
            return false;
        }

        return this.options.highlightedDates[dateString] || false;
    }

    isValidDate(date) {
        return Object.prototype.toString.call(date) === '[object Date]' && !isNaN(date.getTime());
    }

    dateToString(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = (date.getDate()).toString().padStart(2, '0');

        return `${year}-${month}-${day}`;
    }
}
