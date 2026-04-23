function Home() {
    return (
      <div style={styles.container}>
        <h1>Dashboard Overview</h1>
        <div style={styles.cards}>
          <div style={styles.card}>Unemployment Rate</div>
          <div style={styles.card}>Job Growth</div>
          <div style={styles.card}>Top Occupations</div>
        </div>
      </div>
    );
  }
  
  const styles = {
    container: {
      padding: "20px"
    },
    cards: {
      display: "flex",
      gap: "20px",
      marginTop: "20px"
    },
    card: {
      flex: 1,
      padding: "30px",
      backgroundColor: "#e5e7eb",
      borderRadius: "8px",
      textAlign: "center"
    }
  };
  
  export default Home;