/*
 * Copyright (C) 2014-2017 Andrey Antukh <niwi@niwi.nz>
 * Copyright (C) 2014-2017 Jesús Espino Garcia <jespinog@gmail.com>
 * Copyright (C) 2014-2017 David Barragán Merino <bameda@dbarragan.com>
 * Copyright (C) 2014-2017 Juan Francisco Alcántara <juanfran.alcantara@kaleidos.net>
 * Copyright (C) 2014-2017 Alejandro Alonso <alejandro.alonso@kaleidos.net>
 * Copyright (C) 2014-2017 Xavi Julian <xavier.julian@kaleidos.net>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 * File: modules/common/loader.coffee
 */

// FIXME: this code not follows any style and any good practices on coffeescript
// and it should be rewritten in coffeescript style classes.

import * as angular from "angular";
import {timeout} from "../../libs/utils";

export let LoaderDirective = function(tgLoader, $rootscope) {
    const link = function($scope, $el, $attrs) {
        tgLoader.onStart(function() {
            $(document.body).addClass("loader-active");
            return $el.addClass("active");
        });

        return tgLoader.onEnd(function() {
            $(document.body).removeClass("loader-active");
            return $el.removeClass("active");
        });
    };

    return {
        link,
    };
};

export let Loader = function($rootscope) {
    const config = {
        minTime: 300,
    };

    let open = false;
    let startLoadTime = 0;
    let requestCount = 0;
    let lastResponseDate = 0;

    const pageLoaded = function(force= false) {
        if (startLoadTime) {
            let timeoutValue = 0;

            if (!force) {
                const endTime = new Date().getTime();
                const diff = endTime - startLoadTime;

                if (diff < config.minTime) {
                    timeoutValue = config.minTime - diff;
                }
            }

            timeout(timeoutValue, function() {
                $rootscope.$broadcast("loader:end");
                open = false;
                return (window as any).prerenderReady = true;
            }); // Needed by Prerender Server
        }

        startLoadTime = 0;
        requestCount = 0;
        return lastResponseDate = 0;
    };

    const autoClose = function() {
        let intervalAuto;
        return intervalAuto = setInterval((function() {
            if (lastResponseDate && (requestCount === 0)) {
                pageLoaded();

                return clearInterval(intervalAuto);
            }
        }), 50);
    };

    const start = function() {
        startLoadTime = new Date().getTime();
        $rootscope.$broadcast("loader:start");
        return open = true;
    };

    return {
        pageLoaded,
        open() { return open; },
        start(auto) {
            if (auto == null) { auto = false; }
            if (!open) {
                start();
                if (auto) { return autoClose(); }
            }
        },
        onStart(fn) {
            return $rootscope.$on("loader:start", fn);
        },

        onEnd(fn) {
            return $rootscope.$on("loader:end", fn);
        },

        logRequest() {
            return requestCount++;
        },

        logResponse() {
            requestCount--;
            return lastResponseDate = new Date().getTime();
        },
    };
};
Loader.$inject = ["$rootScope"];