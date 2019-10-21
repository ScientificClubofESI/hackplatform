import React, { useState, useCallback, forwardRef } from 'react';
import moment from 'moment';
import { Empty, Tag } from 'antd';
import { connect } from 'react-redux';

import { RegistrationStatuses } from '@hackjunction/shared';

import EmailIcon from '@material-ui/icons/Email';
import EditIcon from '@material-ui/icons/Edit';
import { Box, Paper } from '@material-ui/core';
import MaterialTable from 'components/generic/MaterialTable';

import * as OrganiserSelectors from 'redux/organiser/selectors';
import EditRegistrationModal from 'components/modals/EditRegistrationModal';
import BulkEditRegistrationModal from 'components/modals/BulkEditRegistrationModal';
import BulkEmailModal from 'components/modals/BulkEmailModal';

const AttendeeTable = ({
    organiserProfilesMap,
    emptyRenderer,
    event,
    loading,
    attendees = [],
    footer = null,
    title = 'Participants',
    minimal = false
}) => {
    const [editing, setEditing] = useState();
    const [selected, setSelected] = useState([]);
    const [bulkEdit, setBulkEdit] = useState(false);
    const [bulkEmail, setBulkEmail] = useState(false);

    const toggleBulkEdit = useCallback(() => {
        setBulkEdit(!bulkEdit);
    }, [bulkEdit]);

    const toggleBulkEmail = useCallback(() => {
        setBulkEmail(!bulkEmail);
    }, [bulkEmail]);

    const renderTable = () => {
        if (!loading) {
            if (!Array.isArray(attendees) || attendees.length === 0) return null;
        }

        return (
            <MaterialTable
                title={title}
                showCount
                isLoading={loading}
                data={attendees}
                onRowClick={(e, row) => setEditing(row.user)}
                onSelectionChange={rows => setSelected(rows.map(r => r.user))}
                actions={
                    !minimal
                        ? [
                              {
                                  icon: forwardRef((props, ref) => <EmailIcon {...props} ref={ref} />),
                                  tooltip: 'Email selected',
                                  onClick: toggleBulkEmail
                              },
                              {
                                  icon: forwardRef((props, ref) => <EditIcon {...props} ref={ref} />),
                                  tooltip: 'Edit selected',
                                  onClick: toggleBulkEdit
                              }
                          ]
                        : []
                }
                options={{
                    exportButton: !minimal,
                    selection: !minimal,
                    showSelectAllCheckbox: !minimal,
                    pageSizeOptions: [5, 25, 50],
                    debounceInterval: 500,
                    search: !minimal,
                    paging: !minimal
                }}
                localization={{
                    toolbar: {
                        searchPlaceholder: 'Search by name/email',
                        nRowsSelected: '{0} selected'
                    }
                }}
                components={{
                    Container: forwardRef((props, ref) =>
                        minimal ? <Box {...props} ref={ref} /> : <Paper {...props} ref={ref} />
                    )
                }}
                columns={[
                    {
                        title: 'First name',
                        field: 'answers.firstName',
                        searchable: true
                    },
                    {
                        title: 'Last name',
                        field: 'answers.lastName',
                        searchable: true
                    },
                    {
                        title: 'Email',
                        field: 'answers.email',
                        searchable: true,
                        hidden: minimal
                    },
                    {
                        title: 'Rating',
                        field: 'rating'
                    },
                    {
                        title: 'Status',
                        field: 'status',
                        render: row => {
                            const params = RegistrationStatuses.asObject[row.status];
                            if (!params) return '-';
                            return <Tag color={params.color}>{params.label}</Tag>;
                        }
                    },
                    {
                        title: 'Tags',
                        field: 'tags',
                        render: row => {
                            const { tags } = row;
                            if (!tags || !tags.length) {
                                return '-';
                            } else {
                                return event.tags
                                    .filter(tag => {
                                        return tags.indexOf(tag.label) !== -1;
                                    })
                                    .map(({ color, label }) => (
                                        <Tag key={label} color={color}>
                                            {label}
                                        </Tag>
                                    ));
                            }
                        }
                    },
                    {
                        title: 'Submitted',
                        field: 'createdAt',
                        render: row => moment(row.createdAt).format('MMM Do YYYY HH:mm:ss'),
                        sorting: true,
                        type: 'datetime'
                    },
                    {
                        title: 'Assigned to',
                        field: 'assignedTo',
                        hidden: minimal,
                        render: row => {
                            const userId = row.assignedTo;
                            let text;
                            if (!userId) {
                                text = '-';
                            } else if (organiserProfilesMap.hasOwnProperty(userId)) {
                                const user = organiserProfilesMap[userId];
                                text = `${user.firstName} ${user.lastName}`;
                            } else {
                                text = '???';
                            }
                            return text;
                        }
                    }
                ]}
            />
        );
    };

    const renderEmpty = () => {
        if (loading) return null;
        if (!Array.isArray(attendees) || attendees.length !== 0) return null;
        if (typeof emptyRenderer === 'function') return emptyRenderer();
        return <Empty />;
    };

    return (
        <React.Fragment>
            <EditRegistrationModal registrationId={editing} onClose={setEditing} />
            <BulkEditRegistrationModal visible={bulkEdit} onClose={setBulkEdit} registrationIds={selected} />
            <BulkEmailModal visible={bulkEmail} onClose={setBulkEmail} registrationIds={selected} />
            {renderTable()}
            {renderEmpty()}
        </React.Fragment>
    );
};

const mapStateToProps = state => ({
    organiserProfilesMap: OrganiserSelectors.organisersMap(state),
    event: OrganiserSelectors.event(state)
});

export default connect(mapStateToProps)(AttendeeTable);
