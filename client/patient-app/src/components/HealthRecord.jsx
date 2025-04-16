const CREATE_HEALTH_RECORD = gql`
  mutation CreateHealthRecord(
    $bloodPressure: String!
    $heartRate: String!
    $temperature: String!
    $respiratoryRate: String!
    $user: ID!
  ) {
    createHealthRecord(
      bloodPressure: $bloodPressure
      heartRate: $heartRate
      temperature: $temperature
      respiratoryRate: $respiratoryRate
      user: $user
    ) {
      id
      bloodPressure
      heartRate
      temperature
      respiratoryRate
      user
      createdAt
    }
  }
`;

const HealthRecord = () => {
  const [bloodPressure, setBloodPressure] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [temperature, setTemperature] = useState('');
  const [respiratoryRate, setRespiratoryRate] = useState('');
  const { data: patientData } = useQuery(GET_PATIENT_DATA);

  const [createHealthRecord] = useMutation(CREATE_HEALTH_RECORD, {
    variables: {
      bloodPressure,
      heartRate,
      temperature,
      respiratoryRate,
      user: patientData?.getPatientData?.user
    },
    refetchQueries: [{ query: GET_PATIENT_DATA }]
  });

  // ... existing code ...
} 