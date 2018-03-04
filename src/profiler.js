let profile = {};

module.exports = {
    resetProfile: () => {
        profile = {
            calls: {},
            cpu_usage: {}
        }
    },

    getProfile: () => {
        return profile;
    },

    setCpuFor: ( path, cpu_usage ) => {
        profile.cpu_usage[ path.join( '.' ) ] = cpu_usage;
    },

    incrementCallsFor: ( path ) => {
        if( !profile.calls.hasOwnProperty( path ) ) profile.calls[ path ] = 0;
        profile.calls[ path ] += 1;
    },
};
