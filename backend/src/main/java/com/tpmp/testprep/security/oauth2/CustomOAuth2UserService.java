package com.tpmp.testprep.security.oauth2;

import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String provider = userRequest.getClientRegistration().getRegistrationId().toUpperCase();
        String providerId = oAuth2User.getAttribute("sub");
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        userRepository.findByProviderAndProviderId(provider, providerId)
            .orElseGet(() -> userRepository.findByEmail(email)
                .map(existing -> {
                    if (existing.getProviderId() == null) {
                        existing.linkOAuthProvider(provider, providerId);
                    }
                    return existing;
                })
                .orElseGet(() -> userRepository.save(User.ofOAuth(email, name, provider, providerId)))
            );

        return oAuth2User;
    }
}
