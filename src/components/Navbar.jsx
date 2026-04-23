import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav style={styles.nav}>
      <h2>Job Watcher</h2>
      <div>
        <Link to="/" style={styles.link}>Home</Link>
        <Link to="/trends" style={styles.link}>Trends</Link>
        <Link to="/analysis" style={styles.link}>Analysis</Link>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: "15px",
    backgroundColor: "#1f2937",
    color: "white"
  },
  link: {
    marginLeft: "15px",
    color: "white",
    textDecoration: "none"
  }
};

export default Navbar;