import React, { useState } from 'react';

import { makeStyles } from '@material-ui/core/styles';
import { Box } from '@material-ui/core';
import { connect } from 'react-redux';

import SearchResults from './SearchResults';
import Filters from './Filters';
import CenteredContainer from 'components/generic/CenteredContainer';

import * as RecruitmentSelectors from 'redux/recruitment/selectors';

import ToggleFavorites from './ToggleFavorites';

import { useToggle } from 'hooks/customHooks';

const useStyles = makeStyles(theme => ({
    root: {
        flex: 1,
        backgroundColor: theme.palette.background.default,
        padding: theme.spacing(3)
    }
}));

const SearchPage = ({ favorites }) => {
    const classes = useStyles();

    const [showFavorites, toggleFavorites] = useToggle(false);

    return (
        <div className={classes.root}>
            <CenteredContainer>
                <Box display="flex" flexDirection="row" justifyContent="flex-end">
                    <ToggleFavorites count={favorites.length} active={showFavorites} onChange={toggleFavorites} />
                </Box>
                {showFavorites ? (
                    <SearchResults items={favorites} />
                ) : (
                    <React.Fragment>
                        <Filters />
                        <SearchResults />
                    </React.Fragment>
                )}
            </CenteredContainer>
        </div>
    );
};

const mapState = state => ({
    favorites: RecruitmentSelectors.favorites(state)
});

export default connect(mapState)(SearchPage);
