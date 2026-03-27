'use client';

import Link from 'next/link';
import { CodeXml, Feather, MenuIcon, Newspaper, Wallet2 } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useEffect, useState } from 'react';
import AuthNavigation from '@/utils/auth-navigation';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

export default function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error) {
          console.error('Error checking authentication:', error);
        }
        setUser(user);
      } catch (err) {
        console.error('Failed to check auth:', err);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase.auth]);

  return (
    <>
      <header
        className={
          'sticky top-0 z-10 border-b py-2 max-md:backdrop-blur md:border-none'
        }
      >
        <div className={'container max-md:px-4'}>
          <div
            className={
              'mx-auto flex max-w-2xl items-center justify-between md:rounded-xl md:border md:p-2.5 md:backdrop-blur'
            }
          >
            <Link href={'/protected'}>
              <div
                className={'inline-flex items-center justify-center rounded-lg'}
              >
                IntellexAI
              </div>
            </Link>

            {/* Always show navbar links for development/demo */}
            <section className={'max-md:hidden'}>
              <nav className={'flex items-center gap-8 text-sm'}>
                <Link
                  href='/pages/upload'
                  className={'text-white/70 pl-4 transition hover:text-white'}
                >
                  Upload
                </Link>
                <Link
                  href='/pages/saved-videos'
                  className={'text-white/70 transition hover:text-white'}
                >
                  Library
                </Link>
                <Link
                  href='/pages/statistics'
                  className={'text-white/70 transition hover:text-white'}
                >
                  Statistics
                </Link>
                <Link
                  href='/pages/video-analyser'
                  className={'text-white/70 transition hover:text-white'}
                >
                  TrackX
                </Link>
                <Link
                  href='/pages/investigation'
                  className={'text-white/70 transition pr-4 hover:text-white'}
                >
                  Investigation
                </Link>
              </nav>
            </section>

            <section className={'flex items-center max-md:gap-4'}>
              <div className='flex gap-3'>
                <AuthNavigation />
              </div>

              {/* Always show mobile nav links for development/demo */}
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger>
                  <MenuIcon
                    className={
                      'size-9 transition hover:text-white/70 md:hidden'
                    }
                  />
                </SheetTrigger>
                <SheetContent side={'top'} className={'p-8'}>
                  <div className={'center inline-flex items-center gap-3'}>
                    <div
                      className={
                        'inline-flex size-8 items-center justify-center rounded-lg border'
                      }
                    ></div>
                  </div>
                  <div className={'mb-4 mt-8'}>
                    <nav className={'grid items-center gap-4 text-lg'}>
                      <Link
                        href='/pages/upload'
                        className={
                          'flex items-center gap-3 text-white/70 transition hover:text-white'
                        }
                      >
                        <Feather className={'size-6'} />
                        Upload
                      </Link>
                      <Link
                        href='/pages/realtime-stream'
                        className={
                          'flex items-center gap-3 text-white/70 transition hover:text-white'
                        }
                      >
                        <CodeXml className={'size-6'} />
                        Realtime
                      </Link>
                      <Link
                        href='/pages/saved-videos'
                        className={
                          'flex items-center gap-3 text-white/70 transition hover:text-white'
                        }
                      >
                        <Wallet2 className={'size-6'} />
                        Library
                      </Link>
                      <Link
                        href='/pages/statistics'
                        className={
                          'flex items-center gap-3 text-white/70 transition hover:text-white'
                        }
                      >
                        <Newspaper className={'size-6'} />
                        Statistics
                      </Link>
                      <Link
                        href='/pages/video-analyser'
                        className={
                          'flex items-center gap-3 text-white/70 transition hover:text-white'
                        }
                      >
                        <Feather className={'size-6'} />
                        TrackX
                      </Link>
                      <Link
                        href='/pages/investigation'
                        className={
                          'flex items-center gap-3 text-white/70 transition hover:text-white'
                        }
                      >
                        <Feather className={'size-6'} />
                        Investigate
                      </Link>
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
            </section>
          </div>
        </div>
      </header>
    </>
  );
}
