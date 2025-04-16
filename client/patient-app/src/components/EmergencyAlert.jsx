const CREATE_EMERGENCY_ALERT = gql`
  mutation CreateEmergencyAlert($description: String!, $severity: String!, $user: ID!) {
    createEmergencyAlert(description: $description, severity: $severity, user: $user) {
      id
      description
      severity
      user
      createdAt
    }
  }
`;

const EmergencyAlert = () => {
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('High');
  const { data: patientData } = useQuery(GET_PATIENT_DATA);
  
  const [createEmergencyAlert] = useMutation(CREATE_EMERGENCY_ALERT, {
    variables: {
      description,
      severity,
      user: patientData?.getPatientData?.user
    },
    refetchQueries: [{ query: GET_PATIENT_DATA }]
  });

  // ... existing code ...
} 