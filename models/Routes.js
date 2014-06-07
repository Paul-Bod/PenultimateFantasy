define([
	'../controllers/IndexController',
	'../controllers/MainController',
	'../controllers/BattleController',
	'../controllers/PowerUpController',
	'../controllers/AttributesController',
	'../controllers/SkillsController'
], function (IndexController, MainController, BattleController, PowerUpController, AttributesController, SkillsController) {
	var exports = {};

	exports.route = function (route, params) {
		switch(route) {
			case 'index':
				IndexController.action();
				break;
		    case 'main':
		    	MainController.action();
		    	break;
		   	case 'battle':
		   		BattleController.action();
		   		break;
		    case 'powerup':
		   		PowerUpController.action();
		   		break;
		   	case 'attributes':
		   		AttributesController.action(params);
		   		break;
		    case 'skills':
		   		SkillsController.action(params);
		   		break;
		   	default:
		   		throw new Error('Invalid route');
		   		break;
		}
	};
	
	return exports;
});