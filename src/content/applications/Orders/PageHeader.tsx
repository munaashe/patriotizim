import { Typography, Button, Grid } from '@mui/material';

import AddTwoToneIcon from '@mui/icons-material/AddTwoTone';

function PageHeader() {
  return (
    <Grid container justifyContent="space-between" alignItems="center">
      <Grid item>
        <Typography variant="h3" component="h3" gutterBottom>
          Shop Orders
        </Typography>
        <Typography variant="subtitle2">
          Great Patriot, these are the transactions
        </Typography>
      </Grid>
    </Grid>
  );
}

export default PageHeader;
