const constants = require( '~/constants' ),
    move = require( '~/lib/move' ),
    position = require( '~/lib/position' );

const RenewWorker = require( './RenewWorker' );

let STATES = {
    MOVE_TO_ROOM: 'MOVE_TO_ROOM',
    CLEAR: 'CLEAR'
};

class ExpansionClearer extends RenewWorker {
    constructor( assigner ) {
        super( assigner, STATES.MOVE_TO_ROOM );
        this.MAX_ATTACK = 10;
    }

    getAssigned() {
        let worker_memory = this.getMemory();
        if( !worker_memory.assigned_room ) {
            worker_memory.assigned_room = this.assigner.getAssigned( this.creep, this.assigner.types.EXPANSION_CLEARER );
        }
        return worker_memory.assigned_room;
    }

    getHostileThings( room ) {
        return room.find( FIND_HOSTILE_STRUCTURES );
    }

    _getStates() {
        return {
            [ STATES.MOVE_TO_ROOM ]: ( creep, state_memory, worker_memory ) => {
                let assigned = this.getAssigned();
                if( this.moveToRoom( assigned ) === move.ERR_IN_ROOM ) {
                    return STATES.CLEAR;
                }
            },
            [ STATES.CLEAR ]: ( creep, state_memory, worker_memory ) => {
                if( creep.room.name !== this.getAssigned() ) {
                    return STATES.MOVE_TO_ROOM;
                }

                let target_enemy = Game.getObjectById( worker_memory.target_id );
                if( !target_enemy ) {
                    let enemies = this.getHostileThings( creep.room );

                    if( enemies.length === 0 ) {
                        console.log( 'Done' );
                        this.setSuicide();
                        return;
                    }

                    let target = creep.pos.findClosestByPath( enemies );

                    worker_memory.target_id = target.id;
                    target_enemy = target;
                }

                if( position.inRoom( target_enemy.pos ) && creep.pos.getRangeTo( target_enemy.pos ) > 1 ) {
                    creep.moveTo( target_enemy );
                }
                if( creep.getActiveBodyparts( ATTACK ) ) {
                    let response = creep.attack( target_enemy );
                } else {
                    let response = creep.dismantle( target_enemy );
                }
            }
        }
    }

    getBody( available_energy ) {
        let parts = [ MOVE, WORK ];
        let body = [];

        for( let i = 0; i < this.MAX_ATTACK && ( this.getEnergyOf( body ) + this.getEnergyOf( parts ) ) < available_energy; i++ ) {
            body = body.concat( parts );
        }

        return body;
    }
}

ExpansionClearer.STATES = STATES;

module.exports = ExpansionClearer;
