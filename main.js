const creeps = require( 'creeps' );

module.exports.loop = function() {
    for( let creep_name in Game.creeps ) {
        let creep = Game.creeps[ creep_name ];

        if( creep.carry.energy < creep.carryCapacity ) {
            let sources = creep.room.find( FIND_SOURCES );
            source = creep.pos.findClosestByPath( sources );

            if( creep.harvest( source ) === ERR_NOT_IN_RANGE ) {
                creep.moveTo( source );
            }
        } else {
            if( creep.transfer( Game.spawns[ 'Spawn1' ], RESOURCE_ENERGY ) === ERR_NOT_IN_RANGE ) {
                creep.moveTo( Game.spawns[ 'Spawn1' ] );
            }
        }
    }
}
