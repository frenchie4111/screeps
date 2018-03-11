const constants = require( '~/constants' ),
    move = require( '~/lib/move' );

const LongDistanceReserver = require( './LongDistanceReserver' );

const STATES = {
    GO_TO_RESERVE_ROOM: 'GO_TO_RESERVE_ROOM',
    GO_TO_CONTROLLER: 'GO_TO_CONTROLLER',
    RESERVE: 'RESERVE'
};

class ExpansionReserver extends LongDistanceReserver {
    constructor( assigner ) {
        super( assigner );
        this.default_state = STATES.GO_TO_RESERVE_ROOM;
        this.controller_message = 'Hi';
        if( assigner ) this.assigner_type = assigner.types.EXPANSION_RESERVER;
    }

    getBody( energy ) {
        let body = [ constants.MOVE, constants.CLAIM ];

        if( energy > this.getEnergyOf( body ) ) {
            return body;
        }

        return [];
    }

    doReserve( creep, target ) {
        return creep.claimController( creep.room.controller );
    }
}

module.exports = ExpansionReserver;
