const constants = require( '~/constants' );

const move = require( '~/lib/move' ),
    position = require( '~/lib/position' );

const ContainerHarvester = require( './ContainerHarvester' ),
    HarvestWorker = require( './HarvestWorker' );

class LongDistanceHauler extends ContainerHarvester {
    constructor( assigner ) {
        super( assigner );
        this.default_state = HarvestWorker.STATES.MOVE_TO_TRANSFER;
        this.MAX_CARRY = 16;
        this.run_from_enemy = true;
    }
    
    shouldRunFrom( creep, enemy ) {
        let source_room_name = this.getSourceRoomName( creep, this.getMemory() );
        // Only run if we are in our source room
        if( creep.room.name === source_room_name ) {
            return true;
        }
        return false;
    }

    getLongDistance( creep, worker_memory ) {
        if( !worker_memory.long_distance_source ) {
            worker_memory.long_distance_source = this.assigner.getAssigned( creep, this.assigner.types.LONG_DISTANCE_HAULER );
        }
        return worker_memory.long_distance_source;
    }

    shouldStopHarvesting( creep, container ) {
        if( container.structureType === constants.STRUCTURE_CONTAINER ) {
            return container.store[ constants.RESOURCE_ENERGY ] <= 50;
        }
        return super.shouldStopHarvesting( creep, container );
    }

    getTargetRoomName( creep, worker_memory ) {
        return this.spawn.room.name;
    }

    getTarget( creep, worker_memory ) {
        let memory = this.getMemory();

        let long_distance = this.getLongDistance( creep, worker_memory );
        console.log( 'getTarget', JSON.stringify( long_distance ) );

        if( long_distance.use_link ) {
            console.log( 'Trying to find link' );
            // if( long_distance.link_id ) {
            //     console.log( 'Had link already' );
            //     let link = Game.getObjectById( long_distance.link_id );
            //     if( link ) return link;
            // }
        
            let link = creep.pos
                .findClosestByRange( FIND_MY_STRUCTURES, {
                    filter: {
                        structureType: STRUCTURE_LINK
                    }
                } );
            console.log( 'All links', JSON.stringify( link ) );
        
            if( link ) {
                let path = creep.pos.findPathTo( link );
                console.log( 'Link path', path.length );
                if( path.length < 5 ) {
                    long_distance.link_id = link.id;
                    return link;
                }
            }
        }

        let storages = this.room
            .find( FIND_MY_STRUCTURES, {
                filter: {
                    structureType: STRUCTURE_STORAGE
                }
            } );

        if( !storages ) {
            throw new Error( 'Can\t find storages' );
        }
        
        return storages[ 0 ];
    }

    getSourceRoomName( creep, worker_memory ) {
        return this.getLongDistance( creep, worker_memory ).room_name;
    }

    getSource( creep, worker_memory ) {
        if( !worker_memory.long_distance_source ) {
            worker_memory.long_distance_source = this.assigner.getAssigned( creep, this.assigner.types.LONG_DISTANCE_HAULER );
        }

        const source = Game.getObjectById( worker_memory.long_distance_source.source_id );

        let nearby_structures = creep.room.lookForAtArea( LOOK_STRUCTURES, source.pos.y - 1, source.pos.x - 1, source.pos.y + 1, source.pos.x + 1, true );
        nearby_structures = _.filter( nearby_structures, ( structure ) => structure.structure.structureType === constants.STRUCTURE_CONTAINER );

        if( nearby_structures.length === 0 ) {
            throw new Error( 'No containers' );
        }

        return nearby_structures[ 0 ].structure;
    }

    doHarvest( creep, container ) {
        return creep.withdraw( container, constants.RESOURCE_ENERGY );
    }

    afterTransferring( creep, worker_memory ) {
        worker_memory.long_distance_source = null;
        worker_memory.source_room_name = null;
        return super.afterTransferring( creep, worker_memory );
    }

    moveToRoom( target_room_name ) {
        let memory = this.getMemory();
        if( memory.long_distance_source && memory.long_distance_source.source && memory.long_distance_source.source.exit_pos ) {
            let direction = memory.long_distance_source.direction;
            let exit_pos = memory.long_distance_source.source.exit_pos;

            if( this.creep.room.name === memory.long_distance_source.room_name ) {
                direction = position.getOpositeDirection( direction );
            } else {
                exit_pos = position.getOpositeEntrancePosition( exit_pos, this.creep.room.name );
            }

            return move.moveToRoom( this.creep, this.getMemory( '_moveToRoom' ), target_room_name, {}, direction, exit_pos );
        }
        return super.moveToRoom( target_room_name );
    }

    getBody( available_energy ) {
        let per_parts = constants.BODYPART_COST[ constants.MOVE ] + constants.BODYPART_COST[ constants.CARRY ];
        let parts = [];

        for( let i = 0; i < this.MAX_CARRY && available_energy > per_parts; i++ ) {
            parts = parts.concat( [ constants.MOVE, constants.CARRY ] );
            available_energy -= per_parts;
        }

        return parts;
    }
}

module.exports = LongDistanceHauler;
