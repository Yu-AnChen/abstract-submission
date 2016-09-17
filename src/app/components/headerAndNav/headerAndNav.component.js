import template from './headerAndNav.html';
import './headerAndNav.styl';

const headerAndNavComponent = {
    template,
    bindings: {

    },
    controller: /* @ngInject */ class headerAndNavController {
        static get $inject() {
            return ['$log', '$timeout', '$scope'];
        }
        constructor($log, $timeout, $scope) {
            this.$log = $log;
            this.$timeout = $timeout;
            this.$scope = $scope;
        }
        $onInit() {
            this.originatorEv;
            this.navigationLinks = this.getNavigationLinks();
        }

        openMenu($mdOpenMenu, ev) {
          this.originatorEv = ev;
          $mdOpenMenu(ev);
        }
        getNavigationLinks() {
            return {
                Home:     "https://www.google.com/",
                Speakers: "#page2",
                Schedule: "#page3",
                Venue:    "#page4",
                Register: "#page5",
            }
        }
    }
};
export default headerAndNavComponent;