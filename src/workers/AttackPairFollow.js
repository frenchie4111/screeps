const constants = require( '~/constants' ),
    move = require( '~/lib/move' ),
    position = require( '~/lib/position' ),
    map = require( '~/lib/map' );

const AttackPairLead = require( './AttackPairLead' );

const STATES = {
    FOLLOW: 'FOLLOW'
};

class AttackPairFollow extends AttackPairLead {
    getAssigned() {
        let worker_memory = this.getMemory();
        if( !worker_memory.assigned_leader ) {
            worker_memory.assigned_leader = this.assigner.getAssigned( this.creep, this.assigner.types.ATTACK_PAIR_FOLLOW );
        }
        return worker_memory.assigned_leader;
    }

    _getStates() {
        let states = super._getStates();


        states[ AttackPairLead.STATES.MOVE_TO_FLAG ] = () => STATES.FOLLOW;
        states[ AttackPairLead.STATES.MOVE_TO_ROOM ] = () => STATES.FOLLOW;

        states[ STATES.FOLLOW ] = ( creep ) => {
            let leader = Game.creeps[ this.getAssigned() ];

            if( !leader ) {
                console.log( 'NO LEADER?', this.getAssigned() );
                this.assigner.unassign( this.assigner.types.ATTACK_PAIR_FOLLOW, creep.id, this.getAssigned() );
                return;
            }

            if( !position.inRoom( creep.pos ) ) {
                this.moveToRoom( leader.room.name );
            } else {
                this.moveTo( leader );
            }

            let leader_target_id = leader.memory.worker_memory.target_id;
            let leader_target = Game.getObjectById( leader_target_id );
            console.log( 'leader_target_id', leader_target_id, leader_target );

            if( creep.hits < creep.hitsMax ) {
                creep.rangedAttack( leader_target );
                creep.heal( creep );
            } else {
                if( this.isNear( creep, leader.id ) ) {
                    console.log( 'heal leader' );
                    creep.rangedAttack( leader_target );
                    creep.heal( leader );
                } else {
                    console.log( 'ranged heal leader' );
                    creep.rangedHeal( leader );
                }
            }
        }

        return states;
    }
}

module.exports = AttackPairFollow;
