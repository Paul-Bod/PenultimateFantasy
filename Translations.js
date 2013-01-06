define(function () {

    /*
     * Regex match for characters in the format {d} and replace with the value in the provided array at the same number.
     * http://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format/4673436#4673436
     */
    String.prototype.format = function(parameters) {

        if (parameters.length <= 0) {
            return this;
        } 

        return this.replace(/{(\d+)}/g, function(match, number) { 
             return typeof parameters[number] !== 'undefined' ? parameters[number] : match;
        });
    };

    var exports = {};

    var translations = {
        format_break : '<br/>',

        heroes_type_w     : 'Warrior',
        heroes_type_wm    : 'White Mage',
        heroes_type_bm    : 'Black Mage',
        heroes_type_al    : 'Alchemist',
        heroes_type_b     : 'Beast',

        heroes_experience          : '{0} has {1} experience.',
        heroes_experiencetolevelup : '{0} must spend {1} experience points in order to level up.',

        enemies_type_ed   : 'Demon Spawn',
        enemies_type_eid  : 'Ice Spawn',
        enemies_type_eed  : 'Thunder Spawn',
        enemies_type_efd  : 'Ember Spawn',
        enemies_type_md   : 'Demon Grunt',
        enemies_type_mid  : 'Frost Demon',
        enemies_type_mfd  : 'Flame Demon',
        enemies_type_mu   : 'Undead Grunt',
        enemies_type_b    : 'Demon Captain',

        mainmenu_title           : 'Main Menu',
        mainmenu_options_battle  : 'Battle',
        mainmenu_options_upgrade : 'Power Up',
        mainmenu_options_shop    : 'Shop',

        battlemenu_title : 'Choose Your Battle',

        upgrademenu_title        : 'What Will You Power Up ?',
        upgrademenu_attributes   : 'Hero Attributes',
        upgrademenu_skills       : 'Hero Skills',
        upgrademenu_heroes_title : 'Choose Hero',

        attributesupgrade_title : 'Which Attribute Will You Power Up ?',
        attributesupgrade_cost  : 'All attributes cost {0} experience to upgrade.',

        abilitiesupgrade_title : 'Which Ability Would You Like To Purchase ?',

        shop_title  : 'Which Items Would You Like To Purchase ?',
        shop_dollars : 'Party has {0} Dollars.',

        nameheroes_title : 'Name your heroes !',
        nameheroes_submitbutton : 'Begin fantasy !',
        nameheroes_errors_samename : '{0} name must not be the same as {1}\'s !',
        nameheroes_errors_length   : '{0} name must be between 1 and 10 characters !',

        battle_selecttarget          : 'Select target !',
        battle_selectenemiesorheroes : 'Select Enemies or Heroes !',
        battle_go                    : '{0}\'s go !',
        battle_options_next          : 'Next Hero',

        battlesummary_money            : 'You\'re party has earned {0} Dollars !',
        battlesummary_experiencegained : '{0} earned {1} experience points !',
        battlesummary_experiencetotal  : '{0} has {1} experience points !',
        battlesummary_continue         : 'Continue',

        items_healthvile_message      : '{0} used a Health Vial on {1} restoring {2} health !',
        items_healthvile_weak_message : '{0} used a Health Vial on {1} doing {2} damage ! {1} is weak against healing items !',

        items_bomb_message       : '{0} used a Bomb on {1} doing {2} damage !',
        items_lifeorb_message    : '{0} used a Life Orb on {1} !',
        items_magicvial_message  : '{0} used a Magic Vial on {1} restoring {2} magic !',

        abilities_attack_message        : '{0} attacked {1} doing {2} physical damage !',
        abilities_attack_absorb_message : '{0} attacked {1}. {1} absorbed {2} physical damage !',
        abilities_attack_immune_message : '{0} attacked {1}. {1} is immune to physical damage !',
        abilities_attack_strong_message : '{0} attacked {1} doing {2} physical damage ! physical damage has little effect on {1} !',
        abilities_attack_weak_message   : '{0} attacked {1} doing {2} physical damage ! {1} is weak against physical damage !',

        abilities_cannonball_message        : '{0} used Cannonball on {1} doing {2} physical damage !',
        abilities_cannonball_absorb_message : '{0} used Cannonball on {1}. {1} absorbed {2} physical damage !',
        abilities_cannonball_immune_message : '{0} used Cannonball on {1}. {1} is immune to physical damage !',
        abilities_cannonball_strong_message : '{0} used Cannonball on {1} doing {2} physical damage ! physical damage has little effect on {1} !',
        abilities_cannonball_weak_message   : '{0} used Cannonball on {1} doing {2} physical damage ! {1} is weak against physical damage !',

        abilities_fire_message        : '{0} cast Fire on {1} doing {2} fire damage !',
        abilities_fire_absorb_message : '{0} cast Fire on {1}. {1} absorbed {2} fire damage !',
        abilities_fire_immune_message : '{0} cast Fire on {1}. {1} is immune to fire damage !',
        abilities_fire_strong_message : '{0} cast Fire on {1} doing {2} fire damage ! Fire damage has little effect on {1} !',
        abilities_fire_weak_message   : '{0} cast Fire on {1} doing {2} fire damage ! {1} is weak against fire damage !',

        abilities_blizzard_message        : '{0} cast Blizzard on {1} doing {2} ice damage !',
        abilities_blizzard_absorb_message : '{0} cast Blizzard on {1}. {1} absorbed {2} ice damage !',
        abilities_blizzard_immune_message : '{0} cast Blizzard on {1}. {1} is immune to ice damage !',
        abilities_blizzard_strong_message : '{0} cast Blizzard on {1} doing {2} ice damage ! Ice damage has little effect on {1} !',
        abilities_blizzard_weak_message   : '{0} cast Blizzard on {1} doing {2} ice damage ! {1} is weak against ice damage !',

        abilities_thunder_message         : '{0} cast Thunder on {1} doing {2} electric damage !',
        abilities_thunder_absorb_message  : '{0} cast Thunder on {1}. {1} absorbed {2} electric damage !',
        abilities_thunder_immune_message  : '{0} cast Thunder on {1}. {1} is immune to electric damage !',
        abilities_thunder_strong_message  : '{0} cast Thunder on {1} doing {2} electric damage ! Electric damage has little effect on {1} !',
        abilities_thunder_weak_message    : '{0} cast Thunder on {1} doing {2} electric damage ! {1} is weak against electric damage !',

        abilities_storm_message         : '{0} cast Storm on {1} doing {2} electric damage !',
        abilities_storm_absorb_message  : '{0} cast Storm on {1}. {1} absorbed {2} electric damage !',
        abilities_storm_immune_message  : '{0} cast Storm on {1}. {1} is immune to electric damage !',
        abilities_storm_strong_message  : '{0} cast Storm on {1} doing {2} electric damage ! Electric damage has little effect on {1} !',
        abilities_storm_weak_message    : '{0} cast Storm on {1} doing {2} electric damage ! {1} is weak against electric damage !',

        abilities_implosion_message         : '{0} cast Implosion on {1} doing {2} fire damage !',
        abilities_implosion_absorb_message  : '{0} cast Implosion on {1}. {1} absorbed {2} fire damage !',
        abilities_implosion_immune_message  : '{0} cast Implosion on {1}. {1} is immune to fire damage !',
        abilities_implosion_strong_message  : '{0} cast Implosion on {1} doing {2} fire damage ! fire damage has little effect on {1} !',
        abilities_implosion_weak_message    : '{0} cast Implosion on {1} doing {2} fire damage ! {1} is weak against fire damage !',

        abilities_cure_message            : '{0} cast Cure on {1} restoring {2} health !',
        abilities_cure_weak_message       : '{0} cast Cure on {1} doing {2} damage ! {1} is weak against healing magic !',

        abilities_healingwind_message      : '{0} cast Healing Wind on {1} restoring {2} health !',
        abilities_healingwind_weak_message : '{0} cast Healing Wind on {1} doing {2} damage ! {1} is weak against healing magic !',

        abilities_healerupt_message      : '{0} cast Heal Erupt on {1} restoring {2} health !',
        abilities_healerup_weak_message : '{0} cast Heal Erupt on {1} doing {2} damage ! {1} is weak against healing magic !',
    };

    exports.translate = function (key, inserts) {

        if (typeof inserts === 'undefined') {
            inserts = [];
        }

        if (typeof translations[key] === 'undefined') {
            throw new Error(key + ' is not a valid translation key.');
        }

        return translations[key].format(inserts);
    };

    exports.getResistanceKey = function (resistance) {

        if (resistance !== '') {
            resistance = '_' + resistance;
        }
        return resistance;
    };

    return exports;
});
