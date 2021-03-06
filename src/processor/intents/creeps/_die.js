var _ = require('lodash'),
    utils =  require('../../../utils'),
    driver = utils.getDriver(),
    C = driver.constants;

module.exports = function(object, roomObjects, bulk, stats, dropRate) {

    if(dropRate === undefined) {
        dropRate = C.CREEP_CORPSE_RATE;
    }

    bulk.remove(object._id);
    delete roomObjects[object._id];

    if(dropRate > 0 && !object.userSummoned) {
        var lifeTime = _.any(object.body, {type: C.CLAIM}) ? C.CREEP_CLAIM_LIFE_TIME : C.CREEP_LIFE_TIME;
        var bodyResources = {energy: utils.calcCreepCost(object.body) * dropRate * object._ticksToLive / lifeTime};

        object.body.forEach(i => {
            if(i.boost) {
                bodyResources[i.boost] = bodyResources[i.boost] || 0;
                bodyResources[i.boost] += C.LAB_BOOST_MINERAL * dropRate * object._ticksToLive / lifeTime;
                bodyResources.energy += C.LAB_BOOST_ENERGY * dropRate * object._ticksToLive / lifeTime;
            }
        });

        _.forEach(bodyResources, (amount, resourceType) => {
            if(amount > 0) {
                require('./_create-energy')(object.x, object.y, object.room, Math.floor(amount), roomObjects, bulk,
                    resourceType, object.dropToContainer);
            }
        });

        C.RESOURCES_ALL.forEach(resourceType => {
            if (object[resourceType] > 0) {
                require('./_create-energy')(object.x, object.y, object.room,
                    object[resourceType], roomObjects, bulk, resourceType, object.dropToContainer);
            }
        });
    }

    if (stats && object.user != '3' && object.user != '2') {
        stats.inc('creepsLost', object.user, object.body.length);
    }
};