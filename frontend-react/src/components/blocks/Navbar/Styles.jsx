import styled from "@emotion/styled";

export const Navbar = styled.div`
  background-color: #ffffff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;

  .logo {
    color: #3166f6;
    font-weight: bold;
    font-size: 24px;
  }
`;

export const Button = styled.button`
  background-color: #3166f6;
  border: none;
  border-radius: 5px;
  color: white;
  cursor: pointer;
  font-weight: bold;
  padding: 6px 10px;

  transition: box-shadow 100ms;

  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);

  &:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
      0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
`;
