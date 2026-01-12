export const mockInstallationState = {
  installation_state: 'NORMAL',
  crowdedness: 'LOW',
  queue_length: 0,
  network_latency: 50,
  network_failure_rate: 0,
  programs: [
    {
      id: 'prog_001',
      name: 'Northern Lights Theme',
      available_now: true,
      status: 'OPEN',
      options: [
        { id: 'opt_1', label: 'Blue Aurora', votes: 45 },
        { id: 'opt_2', label: 'Green Aurora', votes: 38 }
      ]
    }
  ],
  messages: [
    { id: 'msg_1', author: 'User_A', text: 'Amazing lights!', timestamp: new Date().toISOString() }
  ],
  queue_status: 'EMPTY'
};
