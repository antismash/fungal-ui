angular.module('antismash.ui.bacterial.routing', [
  'ui.router',
  'antismash.ui.bacterial.as_about',
  'antismash.ui.bacterial.as_start'
]).config([
  '$stateProvider',
  '$urlRouterProvider',
  function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/start');

    $stateProvider.
      state('start', {
        url: '/start',
        templateUrl: 'start/start.html',
        controller: 'AsStartCtrl',
        controllerAs: 'ctrl'
      }).
      state('show', {
        url: '/show',
        abstract: true,
        template: '<ui-view/>'
      }).
      state('show.job', {
        url: '/job/:id',
        template: '<div class="wide-container"><as-job job-id="{{ctrl.id}}"></as-job></div>',
        controller: function ($stateParams) {
          this.id = $stateParams.id;
        },
        controllerAs: 'ctrl'
      }).
      state('about', {
        url: '/about',
        templateUrl: 'about/about.html',
        controller: 'AsAboutCtrl',
        controllerAs: 'ctrl'
      });

  }]);
