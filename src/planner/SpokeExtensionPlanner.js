const constants = require( '~/constants' );

const ConstructionPlanner = require( './ConstructionPlanner' );

const MIN_DIST = 2;
const MAX_DIST = 4;
const MAX_FAR_DIST = 7;
const CONSIDER_CORNERS_AFTER = 2;

const DIRECTIONS = [
    [ -1, -1 ],
    [ -1, 1 ],
    [ 1, 1 ],
    [ 1, -1 ]
];

const IGNORE_DIRECTIONS = [
    [ -2, -4 ],
    [ +2, -4 ],
];

class ExtensionPlanner extends ConstructionPlanner {
    constructor( name, dry_run=false ) {
        super( name, constants.STRUCTURE_EXTENSION, dry_run );
        this._direction_lists = {};
    }

    _shouldCreateNewStructure( room, spawn, pending=[] ) {
        return (
            ( !this.hasRunBefore( room ) ) &&
            ( this.getNewAllowedStructureCount( room ) - pending.length ) > 0
        );
    }

    _getNewPositions( room, spawn ) {
        
    }
}

module.exports = ExtensionPlanner;
