
import { Outlet } from "react-router-dom";
import Header from "../mainComponents/Header";
const Home = () => {


    return (
      <div>
        <Header />
        <main>
          <Outlet />
        </main>
      </div>
    );
  }
  
  export default Home;
  