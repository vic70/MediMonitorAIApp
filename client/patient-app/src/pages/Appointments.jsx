import { useState } from 'react';
import { Container, Card, Badge, Button, Form, Row, Col, Alert, Modal } from 'react-bootstrap';
import { useQuery, useMutation, gql } from '@apollo/client';
import { format, parseISO, isPast, isFuture } from 'date-fns';

const GET_PATIENT_APPOINTMENTS = gql`
  query GetPatientAppointments($patientId: ID!) {
    appointmentsByPatientId(patientId: $patientId) {
      id
      date
      time
      status
      reason
      notes
      nurse {
        id
        user {
          firstName
          lastName
        }
      }
    }
    patientById(id: $patientId) {
      id
      preferredNurses {
        id
        user {
          firstName
          lastName
        }
      }
    }
  }
`;

const GET_PATIENT_BY_USER_ID = gql`
  query GetPatientByUserId($userId: ID!) {
    patientByUserId(userId: $userId) {
      id
    }
  }
`;

const REQUEST_APPOINTMENT = gql`
  mutation RequestAppointment(
    $patientId: ID!, 
    $nurseId: ID,
    $date: String!, 
    $time: String!, 
    $reason: String!, 
    $notes: String
  ) {
    createAppointment(
      patientId: $patientId, 
      nurseId: $nurseId,
      date: $date, 
      time: $time, 
      reason: $reason, 
      notes: $notes,
      status: "REQUESTED"
    ) {
      id
      date
      time
      status
    }
  }
`;

const CANCEL_APPOINTMENT = gql`
  mutation CancelAppointment($appointmentId: ID!) {
    updateAppointment(
      id: $appointmentId,
      status: "CANCELLED"
    ) {
      id
      status
    }
  }
`;

const Appointments = () => {
  const userId = localStorage.getItem('userId');
  const [patientId, setPatientId] = useState(null);
  
  // Request Form State
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestDate, setRequestDate] = useState('');
  const [requestTime, setRequestTime] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [requestNotes, setRequestNotes] = useState('');
  const [selectedNurse, setSelectedNurse] = useState('');
  
  // Cancellation State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  
  // UI States
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Get patient ID from user ID
  const { loading: loadingPatient } = useQuery(GET_PATIENT_BY_USER_ID, {
    variables: { userId },
    skip: !userId,
    onCompleted: (data) => {
      if (data?.patientByUserId?.id) {
        setPatientId(data.patientByUserId.id);
      }
    },
    onError: (error) => {
      console.error('Error fetching patient ID:', error);
      setErrorMessage('Error loading patient data');
    }
  });
  
  // Get appointments
  const { data, loading, refetch } = useQuery(GET_PATIENT_APPOINTMENTS, {
    variables: { patientId },
    skip: !patientId,
    fetchPolicy: 'network-only'
  });
  
  // Request appointment mutation
  const [requestAppointment, { loading: requesting }] = useMutation(REQUEST_APPOINTMENT, {
    onCompleted: () => {
      setSuccessMessage('Appointment requested successfully');
      setShowRequestForm(false);
      clearRequestForm();
      refetch();
      
      // Clear success message after a few seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error) => {
      console.error('Error requesting appointment:', error);
      setErrorMessage(`Error requesting appointment: ${error.message}`);
    }
  });
  
  // Cancel appointment mutation
  const [cancelAppointment, { loading: cancelling }] = useMutation(CANCEL_APPOINTMENT, {
    onCompleted: () => {
      setSuccessMessage('Appointment cancelled successfully');
      setShowCancelModal(false);
      refetch();
      
      // Clear success message after a few seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error) => {
      console.error('Error cancelling appointment:', error);
      setErrorMessage(`Error cancelling appointment: ${error.message}`);
    }
  });
  
  // Helper function to clear request form
  const clearRequestForm = () => {
    setRequestDate('');
    setRequestTime('');
    setRequestReason('');
    setRequestNotes('');
    setSelectedNurse('');
  };
  
  // Handle request form submission
  const handleRequestSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!requestDate || !requestTime || !requestReason) {
      setErrorMessage('Please fill all required fields');
      return;
    }
    
    requestAppointment({
      variables: {
        patientId,
        nurseId: selectedNurse || null,
        date: requestDate,
        time: requestTime,
        reason: requestReason,
        notes: requestNotes || null
      }
    });
  };
  
  // Handle appointment cancellation
  const handleCancelConfirm = () => {
    if (appointmentToCancel) {
      cancelAppointment({
        variables: {
          appointmentId: appointmentToCancel
        }
      });
    }
  };
  
  // Show cancellation modal
  const showCancelConfirmation = (appointmentId) => {
    setAppointmentToCancel(appointmentId);
    setShowCancelModal(true);
  };
  
  // Filter appointments by status
  const getAppointmentsByStatus = (status) => {
    if (!data?.appointmentsByPatientId) return [];
    
    return data.appointmentsByPatientId.filter(appointment => {
      if (status === 'UPCOMING') {
        return (
          isFuture(parseISO(`${appointment.date}T${appointment.time}`)) && 
          appointment.status !== 'CANCELLED'
        );
      } else if (status === 'PAST') {
        return (
          isPast(parseISO(`${appointment.date}T${appointment.time}`)) && 
          appointment.status !== 'CANCELLED'
        );
      } else if (status === 'CANCELLED') {
        return appointment.status === 'CANCELLED';
      }
      return false;
    }).sort((a, b) => {
      // Sort by date and time
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      
      if (status === 'UPCOMING') {
        return dateA - dateB; // Ascending for upcoming
      } else {
        return dateB - dateA; // Descending for past and cancelled
      }
    });
  };
  
  // Format appointment status for display
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge bg="success">Confirmed</Badge>;
      case 'REQUESTED':
        return <Badge bg="warning">Requested</Badge>;
      case 'CANCELLED':
        return <Badge bg="danger">Cancelled</Badge>;
      case 'COMPLETED':
        return <Badge bg="info">Completed</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };
  
  if (loadingPatient || (loading && patientId)) {
    return <Container className="mt-4"><p>Loading appointments...</p></Container>;
  }
  
  return (
    <Container className="my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>My Appointments</h1>
        <Button 
          variant="primary" 
          onClick={() => setShowRequestForm(!showRequestForm)}
        >
          {showRequestForm ? 'Hide Request Form' : 'Request Appointment'}
        </Button>
      </div>
      
      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      
      {showRequestForm && (
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <Card.Title>Request New Appointment</Card.Title>
            <Form onSubmit={handleRequestSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Date *</Form.Label>
                    <Form.Control
                      type="date"
                      value={requestDate}
                      onChange={(e) => setRequestDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Time *</Form.Label>
                    <Form.Control
                      type="time"
                      value={requestTime}
                      onChange={(e) => setRequestTime(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              {data?.patientById?.preferredNurses?.length > 0 && (
                <Form.Group className="mb-3">
                  <Form.Label>Preferred Nurse (Optional)</Form.Label>
                  <Form.Select
                    value={selectedNurse}
                    onChange={(e) => setSelectedNurse(e.target.value)}
                  >
                    <option value="">Select a nurse</option>
                    {data.patientById.preferredNurses.map(nurse => (
                      <option key={nurse.id} value={nurse.id}>
                        {nurse.user.firstName} {nurse.user.lastName}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}
              
              <Form.Group className="mb-3">
                <Form.Label>Reason *</Form.Label>
                <Form.Control
                  type="text"
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="Brief reason for appointment"
                  required
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Additional Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  placeholder="Any additional details the nurse should know"
                />
              </Form.Group>
              
              <div className="d-flex justify-content-end">
                <Button 
                  variant="secondary" 
                  className="me-2"
                  onClick={() => {
                    setShowRequestForm(false);
                    clearRequestForm();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  type="submit"
                  disabled={requesting}
                >
                  {requesting ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}
      
      <h3 className="mt-4 mb-3">Upcoming Appointments</h3>
      {getAppointmentsByStatus('UPCOMING').length > 0 ? (
        getAppointmentsByStatus('UPCOMING').map(appointment => (
          <Card key={appointment.id} className="mb-3 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="d-flex align-items-center mb-2">
                    <h5 className="mb-0 me-2">
                      {format(parseISO(appointment.date), 'MMMM d, yyyy')} at {appointment.time}
                    </h5>
                    {renderStatusBadge(appointment.status)}
                  </div>
                  
                  <p className="mb-1">
                    <strong>Reason:</strong> {appointment.reason}
                  </p>
                  
                  {appointment.nurse && (
                    <p className="mb-1">
                      <strong>Nurse:</strong> {appointment.nurse.user.firstName} {appointment.nurse.user.lastName}
                    </p>
                  )}
                  
                  {appointment.notes && (
                    <p className="mb-1">
                      <strong>Notes:</strong> {appointment.notes}
                    </p>
                  )}
                </div>
                
                {appointment.status !== 'CANCELLED' && (
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={() => showCancelConfirmation(appointment.id)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>
        ))
      ) : (
        <p className="text-muted">No upcoming appointments.</p>
      )}
      
      <h3 className="mt-4 mb-3">Past Appointments</h3>
      {getAppointmentsByStatus('PAST').length > 0 ? (
        getAppointmentsByStatus('PAST').map(appointment => (
          <Card key={appointment.id} className="mb-3 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="d-flex align-items-center mb-2">
                    <h5 className="mb-0 me-2">
                      {format(parseISO(appointment.date), 'MMMM d, yyyy')} at {appointment.time}
                    </h5>
                    {renderStatusBadge(appointment.status)}
                  </div>
                  
                  <p className="mb-1">
                    <strong>Reason:</strong> {appointment.reason}
                  </p>
                  
                  {appointment.nurse && (
                    <p className="mb-1">
                      <strong>Nurse:</strong> {appointment.nurse.user.firstName} {appointment.nurse.user.lastName}
                    </p>
                  )}
                  
                  {appointment.notes && (
                    <p className="mb-1">
                      <strong>Notes:</strong> {appointment.notes}
                    </p>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        ))
      ) : (
        <p className="text-muted">No past appointments.</p>
      )}
      
      <h3 className="mt-4 mb-3">Cancelled Appointments</h3>
      {getAppointmentsByStatus('CANCELLED').length > 0 ? (
        getAppointmentsByStatus('CANCELLED').map(appointment => (
          <Card key={appointment.id} className="mb-3 shadow-sm border-danger">
            <Card.Body>
              <div className="d-flex align-items-center mb-2">
                <h5 className="mb-0 me-2">
                  {format(parseISO(appointment.date), 'MMMM d, yyyy')} at {appointment.time}
                </h5>
                {renderStatusBadge(appointment.status)}
              </div>
              
              <p className="mb-1">
                <strong>Reason:</strong> {appointment.reason}
              </p>
              
              {appointment.nurse && (
                <p className="mb-1">
                  <strong>Nurse:</strong> {appointment.nurse.user.firstName} {appointment.nurse.user.lastName}
                </p>
              )}
            </Card.Body>
          </Card>
        ))
      ) : (
        <p className="text-muted">No cancelled appointments.</p>
      )}
      
      {/* Cancellation Confirmation Modal */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Cancellation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to cancel this appointment? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
            No, Keep Appointment
          </Button>
          <Button 
            variant="danger" 
            onClick={handleCancelConfirm}
            disabled={cancelling}
          >
            {cancelling ? 'Cancelling...' : 'Yes, Cancel Appointment'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Appointments; 