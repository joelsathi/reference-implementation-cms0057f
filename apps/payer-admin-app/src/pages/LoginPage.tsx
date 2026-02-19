/**
 * Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { Box, Divider, Grid, Link, Paper, Stack, Typography } from '@wso2/oxygen-ui'
import { type JSX } from 'react'
import LoginBox from '../components/LoginBox';
import { FileText, ShieldCheck, Clock, Users } from '@wso2/oxygen-ui-icons-react';

export default function LoginPage(): JSX.Element {
  const sloganListItems: {
    icon: JSX.Element;
    title: string;
    description: string;
  }[] = [
    {
      icon: <FileText />,
      title: 'Prior Authorization Management',
      description: 'Streamline PA requests and approvals'
    },
    {
      icon: <ShieldCheck />,
      title: 'Secure Healthcare Data',
      description: 'HIPAA-compliant data handling'
    },
    {
      icon: <Clock />,
      title: 'Real-time Processing',
      description: 'Accelerate authorization workflows'
    },
    {
      icon: <Users />,
      title: 'Multi-payer Support',
      description: 'Manage multiple insurance providers'
    },
  ];
  return (
    <Box sx={{ height: '100vh', display: 'flex' }}>
      <Grid container sx={{ flex: 1 }}>
        <Grid
          size={{ xs: 12, md: 8 }}
          sx={{
            display: 'flex',
            alignItems: 'top',
            justifyContent: 'left',
            padding: 18,
            textAlign: 'left',
            position: 'relative',
          }}
        >
          <Box>
            <Stack
              direction="column"
              alignItems="start"
              gap={4}
              maxWidth={580}
              display={{xs: 'none', md: 'flex'}}
            >
              <Box sx={{ my: 3 }}>
                <Typography variant="h2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  Payer Admin Portal
                </Typography>
              </Box>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Healthcare Prior Authorization Management
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
                  Streamline prior authorization workflows and manage payer relationships efficiently
                </Typography>
                <Stack sx={{gap: 2.5}}>
                  {sloganListItems.map((item) => (
                    <Stack key={item.title} direction="row" sx={{gap: 2, alignItems: 'flex-start'}}>
                      <Box sx={{ mt: 0.5 }}>
                        {item.icon}
                      </Box>
                      <Box>
                        <Typography sx={{fontWeight: 600, mb: 0.5}}>
                          {item.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {item.description}
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </Stack>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper
            sx={{
              display: 'flex',
              padding: 4,
              width: '100%',
              height: '100%',
              flexDirection: 'column',
              position: 'relative',
              textAlign: 'left',
          }}>
            <Box
              sx={{
                alignItems: 'center',
                justifyContent: 'center',
                padding: 4,
                width: '100%',
                maxWidth: 500,
                margin: 'auto'
            }}>
              <LoginBox />
              <Box component="footer" sx={{ mt: 8 }}>
                <Typography sx={{ textAlign: 'center' }}>
                  © Copyright {new Date().getFullYear()}
                </Typography>
                <Stack
                  direction="row"
                  justifyContent="center"
                  sx={{ mt: 2 }}
                  spacing={1}
                >
                  <Link>Privacy Policy</Link>
                  <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                  <Link>Terms of Use</Link>
                </Stack>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
