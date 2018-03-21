const constants = require( '~/constants' );

class BoostManager {
    getBoostQueue( room_name ) {
        Memory.rooms[ room_name ]._boost_queue = Memory.rooms[ room_name ]._boost_queue || [];
        return Memory.rooms[ room_name ]._boost_queue;
    }

    getBoostLab( room ) {
        let labs = room
            .find( FIND_MY_STRUCTURES, {
                filter: {
                    structureType: STRUCTURE_LAB
                }
            } );
        return labs[ 0 ];
    }

    getNeededMineral( room ) {
        let boost_queue = this.getBoostQueue( room.name );

        if( boost_queue.length === 0 ) {
            return null
        }

        let next_boost = boost_queue[ 0 ];
        let next_boost_part = next_boost.type;

        let mineral = Object.keys( BOOSTS[ next_boost_part ] )[ 2 ];
        let amount = next_boost.count * LAB_BOOST_MINERAL;

        return { mineral, amount, creep_id: next_boost.creep_id };
    }

    addCreepToBoostQueue( creep ) {
        let boost_queue = this.getBoostQueue( creep.room.name );

        console.log( 'addCreepToBoostQueue', creep.body );

        _
            .chain( creep.body )
            .reduce( ( full, body_part ) => {
                console.log( body_part );
                if( !body_part.boost ) {
                    if( !full.hasOwnProperty( body_part.type ) ) full[ body_part.type ] = 0;
                    full[ body_part.type ]++;
                }
                console.log( full );
                return full;
            }, {} )
            .forEach( ( count, type ) => {
                console.log( type, count );
                boost_queue.push( {
                    type,
                    count,
                    creep_id: creep.id
                } );
            } )
            .value();
    }

    doManage( room ) {
        let next_boost = this.getNeededMineral( room );
        let boost_memory = this.getBoostQueue( room.name );
        if( !next_boost ) return null;

        let lab = this.getBoostLab( room );
        if( lab.mineralType === next_boost.mineral ) {
            let creep = Game.getObjectById( next_boost.creep_id );
            let boost_response = lab.boostCreep( creep );
            console.log( 'boost_response', constants.lookup( boost_response ) );
            if( boost_response === OK ) {
                boost_memory.splice( 0, 1 );
            }
        }
    }
};

module.exports = new BoostManager();
