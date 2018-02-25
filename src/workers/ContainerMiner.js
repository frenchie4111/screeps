const lodash = require( 'lodash' );

const position = require( '~/lib/position' );

const constants = require( '~/constants' );

const RenewWorker = require( './RenewWorker' );

let STATES = {
    MOVE_TO_CONTAINER: 'MOVE_TO_CONTAINER',
    HARVESTING: 'HARVESTING'
};

const MAX_WORK_PARTS = 6;
const MAX_MOVE_PARTS = 3;

class ContainerMiner extends RenewWorker {
    constructor( assigner ) {
        super( STATES.MOVE_TO_CONTAINER );
        this.assigner = assigner;
    }

    getBody( available_energy ) {
        let body = [ constants.MOVE ];
        let remaining_energy = ( available_energy - constants.BODYPART_COST[ constants.MOVE ] );

        let work_parts = 0;
        while( remaining_energy > constants.BODYPART_COST[ constants.WORK ] && work_parts < MAX_WORK_PARTS ) {
            remaining_energy -= constants.BODYPART_COST[ constants.WORK ];
            body.push( constants.WORK );
            work_parts++;
        }

        let move_parts = 1;
        while( remaining_energy > constants.BODYPART_COST[ constants.MOVE ] && move_parts < MAX_MOVE_PARTS ) {
            remaining_energy -= constants.BODYPART_COST[ constants.MOVE ];
            body.push( constants.MOVE );
            move_parts++;
        }

        return body;
    }

    _getStates() {
        return {
            [ STATES.MOVE_TO_CONTAINER ]: ( creep, state_memory, worker_memory ) => {
                if( !worker_memory.assigned_contianer_id ) {
                    worker_memory.assigned_contianer_id = this.assigner.getAssigned( creep, constants.STRUCTURE_CONTAINER ).id;
                }

                let target = Game.getObjectById( worker_memory.assigned_contianer_id );

                if( position.equal( creep.pos, target.pos ) ) return STATES.HARVESTING
                else {
                    console.log( creep.pos, target.pos );
                };

                this.moveTo( target );
            },
            [ STATES.HARVESTING ]: ( creep, state_memory, worker_memory ) => {
                if( !worker_memory.source_id ) {
                    let source = creep.pos.findClosestByPath( FIND_SOURCES );
                    worker_memory.source_id = source.id;
                }

                creep.harvest( Game.getObjectById( worker_memory.source_id ) );
            }
        }
    }
}

module.exports = ContainerMiner;
